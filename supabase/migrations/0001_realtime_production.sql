-- =====================================================================
-- PART 7 - REALTIME PRODUCTION SYSTEM
-- Idempotent migration. Run once in the Supabase SQL Editor
-- (Dashboard -> SQL Editor) or via `supabase db push`.
--
-- Adds:
--   * Realtime publication + REPLICA IDENTITY FULL for live tables
--   * notifications.audience column (user | admin | all) + routing RLS
--   * menu_items.stock_quantity + configurable low_stock_threshold
--   * SECURITY DEFINER triggers that emit notifications on writes
--     (order status, reservations, reviews, low stock, new coupons)
--
-- SECURITY: triggers are the ONLY writers of system notifications; they
-- run SECURITY DEFINER so no Service Role key is ever needed on a client.
-- RLS still governs who can READ each notification.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Non-breaking schema additions
-- ---------------------------------------------------------------------

-- 1a. Audience routing: 'user' (private), 'admin' (staff), 'all' (public promo)
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS audience TEXT NOT NULL DEFAULT 'user';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'notifications_audience_check'
  ) THEN
    ALTER TABLE public.notifications
      ADD CONSTRAINT notifications_audience_check
      CHECK (audience IN ('user', 'admin', 'all'));
  END IF;
END $$;

-- 1b. Optional numeric stock for configurable low-stock alerts
ALTER TABLE public.menu_items
  ADD COLUMN IF NOT EXISTS stock_quantity INTEGER;

-- 1c. Default low-stock threshold (admin-configurable via settings)
INSERT INTO public.settings (key, value)
VALUES ('low_stock_threshold', '5'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Helpful indexes for the notification feeds
CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON public.notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_audience_created
  ON public.notifications (audience, created_at DESC);

-- ---------------------------------------------------------------------
-- 2. Notification RLS: route reads by audience
--    (existing "Allow users to manage own notifications" stays intact)
-- ---------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins read staff notifications" ON public.notifications;
CREATE POLICY "Admins read staff notifications" ON public.notifications
  FOR SELECT USING (
    audience = 'admin'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Anyone reads public notifications" ON public.notifications;
CREATE POLICY "Anyone reads public notifications" ON public.notifications
  FOR SELECT USING (audience = 'all');

-- Admins may also mark staff/public notifications as read (update is_read)
DROP POLICY IF EXISTS "Admins update staff notifications" ON public.notifications;
CREATE POLICY "Admins update staff notifications" ON public.notifications
  FOR UPDATE USING (
    audience IN ('admin', 'all')
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ---------------------------------------------------------------------
-- 3. Notification emitters (SECURITY DEFINER -> bypass RLS for INSERT)
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.notify_admins(p_title TEXT, p_message TEXT, p_type TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, audience)
  VALUES (NULL, p_title, p_message, p_type, 'admin');
END;
$$;

-- 3a. New order -> notify admins
CREATE OR REPLACE FUNCTION public.tg_orders_after_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.notify_admins(
    'New Order Received',
    'Order #' || substr(NEW.id::text, 1, 8) || '  -  Rs ' || to_char(NEW.total, 'FM999999990.00'),
    'order'
  );
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_orders_after_insert ON public.orders;
CREATE TRIGGER trg_orders_after_insert AFTER INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.tg_orders_after_insert();

-- 3b. Order status / refund change -> notify customer
CREATE OR REPLACE FUNCTION public.tg_orders_after_update()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  status_label TEXT;
BEGIN
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.order_status IS DISTINCT FROM OLD.order_status THEN
    status_label := initcap(replace(NEW.order_status, '-', ' '));
    INSERT INTO public.notifications (user_id, title, message, type, audience)
    VALUES (
      NEW.user_id,
      'Order ' || status_label,
      CASE NEW.order_status
        WHEN 'confirmed'        THEN 'Your order has been accepted and confirmed.'
        WHEN 'preparing'        THEN 'The kitchen is now preparing your order.'
        WHEN 'ready'            THEN 'Your order is packed and ready.'
        WHEN 'out-for-delivery' THEN 'Your order is out for delivery.'
        WHEN 'delivered'        THEN 'Your order has been delivered. Enjoy!'
        WHEN 'cancelled'        THEN 'Your order has been cancelled.'
        WHEN 'refunded'         THEN 'Your order has been refunded.'
        ELSE 'Your order status is now ' || status_label || '.'
      END,
      CASE WHEN NEW.order_status = 'refunded' THEN 'refund' ELSE 'order' END,
      'user'
    );
  ELSIF NEW.payment_status = 'refunded'
        AND OLD.payment_status IS DISTINCT FROM NEW.payment_status THEN
    -- payment refunded without an order_status change
    INSERT INTO public.notifications (user_id, title, message, type, audience)
    VALUES (NEW.user_id, 'Refund Processed', 'Your payment has been refunded successfully.', 'refund', 'user');
  END IF;

  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_orders_after_update ON public.orders;
CREATE TRIGGER trg_orders_after_update AFTER UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.tg_orders_after_update();

-- 3c. New reservation -> notify admins
CREATE OR REPLACE FUNCTION public.tg_reservations_after_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.notify_admins(
    'New Reservation Request',
    NEW.guest_name || '  -  ' || NEW.guests || ' guests  -  ' || NEW.date || ' ' || NEW.time,
    'reservation'
  );
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_reservations_after_insert ON public.reservations;
CREATE TRIGGER trg_reservations_after_insert AFTER INSERT ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.tg_reservations_after_insert();

-- 3d. Reservation accepted / rejected -> notify customer
CREATE OR REPLACE FUNCTION public.tg_reservations_after_update()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.user_id IS NULL OR NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  IF NEW.status = 'confirmed' THEN
    INSERT INTO public.notifications (user_id, title, message, type, audience)
    VALUES (NEW.user_id, 'Reservation Confirmed',
      'Your table for ' || NEW.guests || ' on ' || NEW.date || ' at ' || NEW.time || ' is confirmed.',
      'reservation', 'user');
  ELSIF NEW.status = 'cancelled' THEN
    INSERT INTO public.notifications (user_id, title, message, type, audience)
    VALUES (NEW.user_id, 'Reservation Cancelled',
      'Your reservation for ' || NEW.date || ' at ' || NEW.time || ' has been cancelled.',
      'reservation', 'user');
  END IF;

  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_reservations_after_update ON public.reservations;
CREATE TRIGGER trg_reservations_after_update AFTER UPDATE ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.tg_reservations_after_update();

-- 3e. New review -> notify admins (moderation queue)
CREATE OR REPLACE FUNCTION public.tg_reviews_after_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.notify_admins(
    'New Review Awaiting Moderation',
    NEW.author_name || ' left a ' || NEW.rating || '-star review.',
    'review'
  );
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_reviews_after_insert ON public.reviews;
CREATE TRIGGER trg_reviews_after_insert AFTER INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.tg_reviews_after_insert();

-- 3f. Low stock -> notify admins when stock crosses configurable threshold
CREATE OR REPLACE FUNCTION public.tg_menu_items_low_stock()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  threshold INTEGER;
BEGIN
  SELECT COALESCE((value::text)::integer, 5) INTO threshold
  FROM public.settings WHERE key = 'low_stock_threshold';
  IF threshold IS NULL THEN threshold := 5; END IF;

  IF NEW.stock_quantity IS NOT NULL
     AND NEW.stock_quantity <= threshold
     AND (OLD.stock_quantity IS NULL OR OLD.stock_quantity > threshold) THEN
    PERFORM public.notify_admins(
      'Low Stock Alert',
      NEW.name || ' is running low (' || NEW.stock_quantity || ' left).',
      'stock'
    );
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_menu_items_low_stock ON public.menu_items;
CREATE TRIGGER trg_menu_items_low_stock AFTER UPDATE ON public.menu_items
  FOR EACH ROW EXECUTE FUNCTION public.tg_menu_items_low_stock();

-- 3g. New active coupon -> public promo notification for all customers
CREATE OR REPLACE FUNCTION public.tg_coupons_after_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.is_active THEN
    INSERT INTO public.notifications (user_id, title, message, type, audience)
    VALUES (
      NULL,
      'New Coupon Available',
      'Use code ' || NEW.code || ' for ' ||
      CASE NEW.discount_type
        WHEN 'percentage' THEN NEW.value || '% off'
        ELSE 'Rs ' || NEW.value || ' off'
      END ||
      CASE WHEN NEW.min_order_value > 0 THEN ' on orders above Rs ' || NEW.min_order_value ELSE '' END || '.',
      'coupon',
      'all'
    );
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_coupons_after_insert ON public.coupons;
CREATE TRIGGER trg_coupons_after_insert AFTER INSERT ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION public.tg_coupons_after_insert();

-- ---------------------------------------------------------------------
-- 4. Realtime publication + REPLICA IDENTITY FULL
--    FULL ensures UPDATE/DELETE events carry the full old row so the
--    client can filter (e.g. which cart item was removed on device B).
-- ---------------------------------------------------------------------

DO $$
DECLARE
  t TEXT;
  tbls TEXT[] := ARRAY[
    'orders', 'order_items', 'reservations', 'reviews', 'menu_items',
    'gallery_images', 'coupons', 'notifications', 'settings',
    'cart_items', 'favorite_items'
  ];
BEGIN
  FOREACH t IN ARRAY tbls LOOP
    EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY FULL', t);
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;

-- =====================================================================
-- End of migration
-- =====================================================================
