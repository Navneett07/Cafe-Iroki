-- =========================================================
-- 1. SEED CATEGORIES DATA
-- =========================================================
INSERT INTO public.categories (name, slug, description, is_active) VALUES
('Hot Coffee', 'hot-coffee', 'Rich and aromatic hot espresso-based beverages', true),
('Iced Coffee', 'cold-coffee', 'Refreshing and chilled espresso-based drinks', true),
('Cold Brew', 'cold-brew', 'Smooth 18-hour slow-steeped cold coffee selection', true),
('Matcha', 'matcha', 'Kyoto ceremonial-grade Uji green tea selections', true),
('Small Plates', 'small-plates', 'Pillowy Japanese milk buns and savory snacks', true),
('Bowls & Ramen', 'bowl', 'Authentic wheat ramen in rich, spicy broths', true),
('UFO Burgers', 'ufo-burgers', 'Signature mess-free sealed-edge burger sandwiches', true),
('Taiyaki Waffles', 'taiyaki', 'Traditional Japanese fish-shaped sweet waffles', true)
ON CONFLICT (slug) DO NOTHING;

-- =========================================================
-- 2. SEED MENU ITEMS DATA
-- =========================================================
INSERT INTO public.menu_items (id, category_slug, name, description, price, image_url, is_vegetarian, is_popular, is_in_stock, tags) VALUES
-- Small Plates
('fries-loaded', 'small-plates', 'Iroki Loaded Fries', 'Crispy golden fries tossed in savory Gochujang Mayo, topped with fresh scallions and toasted sesame seeds.', 245.00, 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&auto=format&fit=crop&q=80', true, false, true, ARRAY['Savory', 'Spicy Mayo']),
('arancini-herb', 'small-plates', 'Herb & Cheese Arancini', 'Golden-fried Italian risotto balls stuffed with rich melted Mozzarella, served with a crispy potato wafer.', 245.00, 'https://images.unsplash.com/photo-1541532713592-79a0317b6b77?w=600&auto=format&fit=crop&q=80', true, false, true, ARRAY['Cheesy', 'Best Seller']),
('cheese-bun', 'small-plates', 'Cheese Bun', 'Warm, pillowy Japanese milk bun brushed with garlic butter and stuffed with a rich, sweet cream cheese filling.', 245.00, 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=600&auto=format&fit=crop&q=80', true, false, true, ARRAY['Sweet & Savory', 'Freshly Baked']),
('toast-cheddar', 'small-plates', 'Hawaiian Toast (Chilli Cheddar)', 'Artisanal toast loaded with sharp Chilli Cheddar & melted Mozzarella, baked to bubbling perfection.', 245.00, 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&auto=format&fit=crop&q=80', true, false, true, ARRAY['Cheesy', 'Spicy']),
('toast-broccoli', 'small-plates', 'Hawaiian Toast (Spicy Broccoli)', 'Toast topped with charred spicy broccoli florets, sweet caramelized onions, and a blend of gourmet cheeses.', 275.00, 'https://images.unsplash.com/photo-1541532713592-79a0317b6b77?w=600&auto=format&fit=crop&q=80', true, false, true, ARRAY['Healthy', 'Spicy']),
('toast-zucchini', 'small-plates', 'Hawaiian Toast (Zucchini & Parmesan)', 'Fresh sliced zucchini, shaved rich Parmesan, garlic oil, and herbs on sourdough toast.', 275.00, 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&auto=format&fit=crop&q=80', true, false, true, ARRAY['Gourmet', 'Mild']),
('smiley-fries', 'small-plates', 'Smiley Fries', 'Fun potato smiles loaded with melted cheese and fresh parsley. Crafted especially for kids.', 195.00, 'https://images.unsplash.com/photo-1576107232684-1279f390859f?w=600&auto=format&fit=crop&q=80', true, false, true, ARRAY['Kids Menu', 'Cheese Loaded']),

-- Bowls & Ramen
('ramen-tofu', 'bowl', 'Spicy Tofu Ramen', 'Authentic wheat noodles in a rich, fiery soy broth, served with grilled tofu, scallions, nori seaweed, and bamboo shoots.', 345.00, 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&auto=format&fit=crop&q=80', true, true, true, ARRAY['Ramen', 'Spicy', 'Popular']),
('ramen-mushroom', 'bowl', 'Hot Mushroom Ramen', 'Savory Japanese ramen with pan-seared shiitake and button mushrooms, rich spicy broth, sweet corn, and sesame.', 345.00, 'https://images.unsplash.com/photo-1557872943-16a5ac26437e?w=600&auto=format&fit=crop&q=80', true, false, true, ARRAY['Ramen', 'Mushroom lovers', 'Must Try']),
('curry-rice', 'bowl', 'Japanese Curry Rice', 'Crispy vegetable tempura served over a bed of warm sticky rice, covered in a sweet and aromatic house Japanese curry sauce.', 345.00, 'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?w=600&auto=format&fit=crop&q=80', true, false, true, ARRAY['Japanese Classic', 'Comfort Food']),
('mac-cheese', 'bowl', 'Mac N Cheese Classic', 'Elbow macaroni baked in a velvety sharp cheddar sauce, topped with crunchy buttered breadcrumbs and fresh parsley.', 315.00, 'https://images.unsplash.com/photo-1543339494-b4cd4f7ba686?w=600&auto=format&fit=crop&q=80', true, false, true, ARRAY['Comfort', 'Cheesy']),
('mac-chilli', 'bowl', 'Mac N Chilli', 'Decadent mac and cheese infused with dynamic crispy house chilli crisp, sliced black olives, and fresh basil.', 315.00, 'https://images.unsplash.com/photo-1543339494-b4cd4f7ba686?w=600&auto=format&fit=crop&q=80', true, false, true, ARRAY['Spicy Twist', 'Bold']),
('mac-curry', 'bowl', 'Mac N Curry', 'Gourmet mac and cheese enriched with caramelized onions, steamed broccoli florets, and a generous shaving of Parmesan.', 315.00, 'https://images.unsplash.com/photo-1543339494-b4cd4f7ba686?w=600&auto=format&fit=crop&q=80', true, false, true, ARRAY['Fusion', 'Savory']),

-- UFO Burgers
('burger-clt', 'ufo-burgers', 'New York CLT UFO Burger', 'Signature sealed-edge UFO burger containing sharp cheddar, crisp lettuce, fresh tomato slices, and secret house burger sauce.', 295.00, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80', true, true, true, ARRAY['Classic', 'No Mess UFO']),
('burger-paneer', 'ufo-burgers', 'Korean Paneer UFO Burger', 'Sealed bun with paneer glazed in sticky sweet-spicy Gochujang glaze, topped with sesame mayo and zesty pickled onions.', 325.00, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80', true, false, true, ARRAY['Korean Spice', 'Chef Signature']),
('burger-mushroom', 'ufo-burgers', 'Tokyo Mushroom UFO Burger', 'Juicy sautéed mushrooms in soy-glaze, layered with caramelized onions, and loaded with rich sesame aioli inside a sealed bun.', 345.00, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80', true, false, true, ARRAY['Umami', 'Japanese Fusion']),
('burger-pesto', 'ufo-burgers', 'Milan Mozzarella & Pesto UFO Burger', 'Sealed Italian-style burger packed with fresh basil pesto, tomato rounds, and creamy melted Mozzarella cheese.', 325.00, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80', true, false, true, ARRAY['Herbaceous', 'Italian Blend']),
('burger-truffle', 'ufo-burgers', 'Paris Truffle UFO Burger', 'Seared minced soy protein, roasted bell peppers, and velvety Mornay cheese sauce infused with rich truffle oil.', 345.00, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80', true, false, true, ARRAY['Truffle', 'Luxury Choice']),

-- Taiyaki Waffles
('taiyaki-cheese', 'taiyaki', 'Cheese & Chocolate Taiyaki', 'Traditional Japanese fish-shaped waffle filled with a molten core of sweet cream cheese and warm dark chocolate.', 245.00, 'https://images.unsplash.com/photo-1582772643801-b8d9600d8be9?w=600&auto=format&fit=crop&q=80', true, false, true, ARRAY['Dessert', 'Fish Waffle']),
('taiyaki-banana', 'taiyaki', 'Caramel Banana Taiyaki', 'Crispy fish-shaped waffle filled with smooth Nutella hazelnut spread, caramelized banana slices, and dusted with rich cocoa.', 245.00, 'https://images.unsplash.com/photo-1582772643801-b8d9600d8be9?w=600&auto=format&fit=crop&q=80', true, false, true, ARRAY['Nutella', 'Sweet']),
('taiyaki-custard', 'taiyaki', 'Custard Cream Taiyaki', 'Fish waffle filled with premium Madagascar vanilla custard and a surprise crunch of salty potato chips under a sugar glaze.', 245.00, 'https://images.unsplash.com/photo-1582772643801-b8d9600d8be9?w=600&auto=format&fit=crop&q=80', true, true, true, ARRAY['Custard', 'Sweet & Salty']),
('taiyaki-matcha', 'taiyaki', 'Matcha & Chocolate Taiyaki', 'Fish waffle containing sweet Japanese green tea cream, white chocolate chips, and crushed roasted almonds.', 245.00, 'https://images.unsplash.com/photo-1582772643801-b8d9600d8be9?w=600&auto=format&fit=crop&q=80', true, false, true, ARRAY['Authentic Matcha', 'Unique']),
('taiyaki-biscoff', 'taiyaki', 'Lotus Biscoff Taiyaki', 'Crisp waffle loaded with Lotus Biscoff spread and cookie crumbles, served with a scoop of premium vanilla bean ice cream.', 245.00, 'https://images.unsplash.com/photo-1582772643801-b8d9600d8be9?w=600&auto=format&fit=crop&q=80', true, false, true, ARRAY['Indulgent', 'Ice Cream Side']),

-- Hot Coffee
('hot-americano', 'hot-coffee', 'Americano', 'Double shot of rich espresso topped up with hot water, extracting notes of roasted cacao.', 130.00, 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&auto=format&fit=crop&q=80', true, false, true, ARRAY['Classic', 'Unsweetened']),
('hot-cortado', 'hot-coffee', 'Cortado', 'Perfect 1:1 ratio balance of double espresso and steamed milk, reducing acidity with smooth milk texture.', 135.00, 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&auto=format&fit=crop&q=80', true, false, true, ARRAY['Strong', 'Balanced']),
('hot-cappuccino', 'hot-coffee', 'Cappuccino', 'Classic double espresso topped with equal parts steamed milk and aerated, thick milk foam.', 155.00, 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&auto=format&fit=crop&q=80', true, false, true, ARRAY['Classic', 'Foamy']),
('hot-latte', 'hot-coffee', 'Latte', 'Gentle espresso combined with rich steamed milk, completed with a thin layer of microfoam.', 155.00, 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&auto=format&fit=crop&q=80', true, false, true, ARRAY['Milky', 'Smooth']),
('hot-honey-jaggery', 'hot-coffee', 'Honey Jaggery Cappuccino', 'Cappuccino naturally sweetened with organic honey and rustic local Indian jaggery.', 175.00, 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&auto=format&fit=crop&q=80', true, false, true, ARRAY['Natural Sweetener', 'Popular']),
('hot-mocha', 'hot-coffee', 'Cafe Mocha', 'Double espresso blended with in-house dark mocha chocolate sauce, finished with hot texturized milk.', 175.00, 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&auto=format&fit=crop&q=80', true, false, true, ARRAY['Chocolatey', 'Rich']),
('hot-nutella-mocha', 'hot-coffee', 'Nutella Mocha', 'A decadent blend of double espresso, thick Nutella spread, and hot steamed chocolate milk.', 195.00, 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&auto=format&fit=crop&q=80', true, false, true, ARRAY['Sweet', 'Indulgent']),
('hot-white-mocha', 'hot-coffee', 'Kyoto White Mocha', 'Double espresso infused with smooth white chocolate syrup and velvety steamed milk.', 175.00, 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&auto=format&fit=crop&q=80', true, false, true, ARRAY['Sweet White Choc', 'Smooth']),
('hot-tuxedo', 'hot-coffee', 'Tuxedo Mocha', 'Sophisticated combination of dark mocha sauce, white chocolate syrup, espresso, and warm foam.', 185.00, 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&auto=format&fit=crop&q=80', true, false, true, ARRAY['Dual Chocolate', 'Visual layer']),

-- Iced Coffee
('iced-americano', 'cold-coffee', 'Iced Americano', 'Double espresso poured over chilled water and ice rocks. Unbelievably refreshing.', 140.00, 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&auto=format&fit=crop&q=80', true, false, true, ARRAY['Chilled', 'Bold']),
('iced-latte', 'cold-coffee', 'Iced Latte', 'Chilled milk and ice cubes topped with double espresso. Rich and smooth.', 155.00, 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&auto=format&fit=crop&q=80', true, false, true, ARRAY['Customizable', 'Chilled']),
('iced-jamun-espresso', 'cold-coffee', 'Spice Jamun Espresso', 'Exotic fusion of sweet and tangy spiced jamun pulp, shaken with ice and loaded with bold espresso.', 175.00, 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&auto=format&fit=crop&q=80', true, true, true, ARRAY['Nagpur Local Twist', 'Tangy', 'Unique']),
('iced-mocha', 'cold-coffee', 'Iced Mocha', 'Espresso mixed with premium dark chocolate sauce and chilled milk over ice.', 185.00, 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&auto=format&fit=crop&q=80', true, false, true, ARRAY['Chocolatey', 'Chilled']),
('iced-caramel', 'cold-coffee', 'Sea Salt Caramel Latte', 'Chilled espresso combined with premium caramel sauce, a pinch of sea salt, and cold milk over ice.', 185.00, 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&auto=format&fit=crop&q=80', true, false, true, ARRAY['Sweet & Salty', 'Customer Favorite']),
('iced-pistachio', 'cold-coffee', 'Iced Pistachio Latte', 'Premium pistachio butter blended with cold milk, poured over ice and finished with espresso.', 195.00, 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&auto=format&fit=crop&q=80', true, false, true, ARRAY['Nutty', 'Subtle Green']),
('iced-pistachio-mocha', 'cold-coffee', 'Iced Pistachio Mocha', 'Espresso and rich chocolate milk poured over ice, crowned with a decadent, light-green pistachio foam cloud.', 225.00, 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&auto=format&fit=crop&q=80', true, false, true, ARRAY['Luxury Blend', 'Dual Layer']),
('iced-biscoff-latte', 'cold-coffee', 'Iced Biscoff Latte', 'Biscoff cookie butter dissolved into warm espresso, shaken with ice, cold milk, and topped with cookie crumbs.', 195.00, 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&auto=format&fit=crop&q=80', true, false, true, ARRAY['Cookie Butter', 'Sweet']),

-- Matcha
('matcha-vanilla', 'matcha', 'Honey Vanilla Matcha', 'Ceremonial grade Japanese Uji matcha whisked with organic honey, vanilla extract, and creamy oat milk.', 245.00, 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=600&auto=format&fit=crop&q=80', true, false, true, ARRAY['Uji Matcha', 'Oat Milk Included', 'Healthy']),
('matcha-raspberry', 'matcha', 'Iced Raspberry Matcha', 'A striking layered drink: sweet raspberry puree at the bottom, oat milk, topped with rich emerald-green whisked matcha.', 245.00, 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=600&auto=format&fit=crop&q=80', true, true, true, ARRAY['Layered Drink', 'Fruity & Earthy', 'Aesthetic']),
('matcha-strawberry', 'matcha', 'Chia Strawberry Matcha', 'Matcha combined with fresh strawberry compote, organic chia seed expansion, and chilled oat milk.', 255.00, 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=600&auto=format&fit=crop&q=80', true, false, true, ARRAY['Superfood', 'Strawberry', 'Healthy']),
('matcha-pistachio', 'matcha', 'Iced Pistachio Matcha', 'Whisked organic matcha poured over iced oat milk, crowned with a smooth, sweet pistachio cream cloud.', 275.00, 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=600&auto=format&fit=crop&q=80', true, false, true, ARRAY['Premium Matcha', 'Pistachio Cloud', 'Award Winner']),

-- Cold Brew
('cb-straight', 'cold-brew', 'Straight Up Cold Brew', 'Premium light-roast coffee beans steeped cold for 18 hours, presenting a clean, low-acid, and naturally sweet brew.', 155.00, 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&auto=format&fit=crop&q=80', true, false, true, ARRAY['18-Hr Steep', 'Sugar Free']),
('cb-basil', 'cold-brew', 'OG Basil Cold Brew', 'Cold brew coffee infused with aromatic sweet fresh basil leaves, serving a unique clean botanical finish.', 195.00, 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&auto=format&fit=crop&q=80', true, false, true, ARRAY['Botanical', 'Refreshing']),
('cb-yuzu', 'cold-brew', 'Yuzu Cold Brew', 'Tangy and citrusy Japanese yuzu pulp shaken with cold brew coffee, creating an exquisite afternoon pick-me-up.', 195.00, 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&auto=format&fit=crop&q=80', true, false, true, ARRAY['Japanese Citrus', 'Zesty']),
('cb-vietnamese', 'cold-brew', 'Vietnamese Cold Brew', 'Signature cold brew layered over a sweet base of thick condensed milk, creating a balanced creamy sweet drink.', 195.00, 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&auto=format&fit=crop&q=80', true, true, true, ARRAY['Creamy', 'Sweet'])
ON CONFLICT (id) DO NOTHING;

-- =========================================================
-- 3. SEED GALLERY RECORDS
-- =========================================================
INSERT INTO public.gallery_images (id, category, title, description, image_url, span_config) VALUES
('gal-1', 'coffee', 'Ceremonial Matcha Preparation', 'Authentic Kyoto Uji green tea whisked using bamboo tools.', 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=800&auto=format&fit=crop&q=80', 'md:col-span-2 md:row-span-2'),
('gal-2', 'food', 'Signature UFO Burger', 'Our sealed-edge New York CLT, capturing juices without mess.', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80', 'md:col-span-1 md:row-span-1'),
('gal-3', 'interior', 'Minimalist Reading Corner', 'Peaceful Japanese wooden aesthetics combined with reading lights.', 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&auto=format&fit=crop&q=80', 'md:col-span-1 md:row-span-2'),
('gal-4', 'food', 'Golden Taiyaki Waffles', 'Freshly baked fish-shaped waffles filled with custard.', 'https://images.unsplash.com/photo-1582772643801-b8d9600d8be9?w=800&auto=format&fit=crop&q=80', 'md:col-span-1 md:row-span-1'),
('gal-5', 'coffee', 'Slow Bar V-60 Drip', 'Single origin pour-over coffee extracted with laboratory precision.', 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80', 'md:col-span-2 md:row-span-1'),
('gal-6', 'interior', 'Zen Workspace Desks', 'Fitted workstations with charging sockets and high-speed WiFi.', 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=80', 'md:col-span-1 md:row-span-1'),
('gal-7', 'events', 'Pour Over Cupping Workshop', 'Nagpur coffee enthusiasts testing roast profiles.', 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&auto=format&fit=crop&q=80', 'md:col-span-2 md:row-span-2'),
('gal-8', 'events', 'Late Night Acoustical Vibe', 'Earthy sounds filling our cozy Japanese-themed hall.', 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&auto=format&fit=crop&q=80', 'md:col-span-1 md:row-span-1')
ON CONFLICT (id) DO NOTHING;

-- =========================================================
-- 4. SEED DEMO REVIEWS DATA
-- =========================================================
INSERT INTO public.reviews (id, rating, text, author_name, status, tags) VALUES
('rev-sujal', 5, 'Great experience, beautiful ambiance! Must try their UFO burger and Ramen. Perfect spot to chill.', 'Sujal Gupta', 'approved', ARRAY['UFO Burger', 'Ramen', 'Ambiance']),
('rev-ikshuda', 5, 'Had such a good experience at this cafe ✨ The food was fresh, tasty, and beautifully presented. The ambiance is super cozy and aesthetic — perfect for chilling, dates, or even just relaxing with coffee.', 'Ikshuda', 'approved', ARRAY['Cozy Vibes', 'Presentation', 'Aesthetic']),
('rev-poorva', 5, 'You will happily overeat in this cafe! 10/10 food, 10/10 aesthetics, 10/10 recommended. Excellent Japanese theme!', 'Poorva', 'approved', ARRAY['10/10 Food', 'Aesthetics', 'Recommended']),
('rev-pratiksha', 5, 'Great atmosphere, delicious food, and excellent service. The café has a cozy vibe and is a wonderful spot to hang out with friends or work peacefully.', 'Pratiksha Nikalje', 'approved', ARRAY['Polite Staff', 'Peaceful Workspace']),
('rev-pranali', 5, 'Taiyaki and UFO burger is just osm. I really love the taste. Everything is just 10/10. Highly recommended!', 'Pranali Rupchand Kothekar', 'approved', ARRAY['Taiyaki', 'UFO Burger', 'Delicious']),
('rev-vedika', 5, 'It was a great experience, nice ambiance and taste too. Garnishing and presentation was outstanding. Iroki gives nice cozy vibes.', 'Vedika Bhadke', 'approved', ARRAY['Garnishing', 'Presentation', 'Cozy Vibes']),
('rev-swati', 5, 'Had such a delightful experience at Iroki! The vibe is cozy yet aesthetic, giving a perfect little escape into a Japanese café setting. The highlight was definitely the UFO burger—not just visually fun but really yummy.', 'Swati Kedia', 'approved', ARRAY['UFO Burger', 'Cozy Escape', 'Aesthetic'])
ON CONFLICT (id) DO NOTHING;

-- =========================================================
-- 5. SEED COUPONS DATA
-- =========================================================
INSERT INTO public.coupons (code, discount_type, value, max_discount, min_order_value, expiry_date, is_active) VALUES
('IROKI10', 'percentage', 10.00, 100.00, 350.00, '2027-12-31', true),
('WELCOME15', 'percentage', 15.00, 150.00, 500.00, '2027-12-31', true),
('MATCHA20', 'fixed', 50.00, 50.00, 450.00, '2027-12-31', true)
ON CONFLICT (code) DO NOTHING;

-- =========================================================
-- 6. SEED SETTINGS DATA
-- =========================================================
INSERT INTO public.settings (key, value) VALUES
('cafe_status', '{"is_open": true, "message": "Welcome to Cafe Iroki Samarth Nagar"}'::jsonb),
('tax_rates', '{"gst_percentage": 5, "service_charge": 0}'::jsonb),
('business_hours', '{"open": "11:00", "close": "23:00"}'::jsonb)
ON CONFLICT (key) DO NOTHING;
