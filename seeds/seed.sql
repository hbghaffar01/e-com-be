-- Seed all products from frontend constants.ts
-- This ensures all frontend products exist in database to avoid foreign key violations

-- Seed sample merchant
INSERT INTO merchants (id, company_name, owner_name, email, phone, store_status, joined_date)
VALUES ('m1', 'Bazaarly Electronics', 'Ali Khan', 'ali@example.com', '+92-300-0000000', 'Approved', NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert all products from frontend
INSERT INTO products (id, name, brand, price, old_price, rating, reviews, image, images, is_express, category, sub_category, badge, specs, merchant_id, made_in, warranty_detail, delivery_time, delivery_area, bulk_min_qty, bulk_price)
VALUES
-- Electronics - Mobiles
('e1', 'Apple iPhone 15 Pro Max 256GB Natural Titanium', 'Apple', 439999, 509999, 4.8, 1250, 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?q=80&w=1000&auto=format&fit=crop', '["https://images.unsplash.com/photo-1695048133142-1a20484d2569?q=80&w=1000&auto=format&fit=crop"]', TRUE, 'Electronics', 'Mobiles & Tablets', 'Flash Sale', '{"Display":"6.7\" OLED","Processor":"A17 Pro","Storage":"256GB","Battery":"4441 mAh"}', NULL, NULL, NULL, '2-4 Days', 'Nationwide', 10, 420000),

('e3', 'Samsung Galaxy S24 Ultra 5G 512GB Titanium Gray', 'Samsung', 389999, 459999, 4.9, 820, 'https://images.unsplash.com/photo-1706469980834-36cc556c02c2?q=80&w=1000&auto=format&fit=crop', '["https://images.unsplash.com/photo-1706469980834-36cc556c02c2?q=80&w=1000&auto=format&fit=crop"]', TRUE, 'Electronics', 'Mobiles & Tablets', NULL, '{"Display":"6.8\" AMOLED","Processor":"SD 8 Gen 3","Storage":"512GB","Camera":"200MP Main"}', NULL, NULL, NULL, '2-4 Days', 'Nationwide', 5, 375000),

-- Electronics - TVs
('tv1', 'Sony Bravia 65 Inch X80L 4K Ultra HD Smart LED TV', 'Sony', 245000, 285000, 4.9, 215, 'https://images.unsplash.com/photo-1615210230840-69c07c13b4d1?q=80&w=1000&auto=format&fit=crop', '["https://images.unsplash.com/photo-1615210230840-69c07c13b4d1?q=80&w=1000&auto=format&fit=crop"]', TRUE, 'Electronics', 'TVs & Videos', 'Premium', '{"Resolution":"4K UHD","Refresh Rate":"60Hz","HDMI Ports":"4","Smart OS":"Google TV"}', NULL, NULL, NULL, '2-4 Days', 'Nationwide', NULL, NULL),

('tv2', 'Samsung 55" Q60C QLED 4K Smart Hub TV', 'Samsung', 185000, 210000, 4.7, 104, 'https://images.unsplash.com/photo-1593784991095-a205069470b6?q=80&w=1000&auto=format&fit=crop', '["https://images.unsplash.com/photo-1593784991095-a205069470b6?q=80&w=1000&auto=format&fit=crop"]', TRUE, 'Electronics', 'TVs & Videos', NULL, '{"Panel":"QLED","Resolution":"4K","Smart Hub":"Tizen OS","HDR":"Quantum HDR"}', NULL, NULL, NULL, '2-4 Days', 'Nationwide', NULL, NULL),

-- Electronics - Large Appliances
('ref1', 'Haier Inverter Refrigerator HRF-438 IDR Digital Control', 'Haier', 135000, 155000, 4.7, 320, 'https://images.unsplash.com/photo-1571175432268-24234f623df2?q=80&w=1000&auto=format&fit=crop', '["https://images.unsplash.com/photo-1571175432268-24234f623df2?q=80&w=1000&auto=format&fit=crop"]', FALSE, 'Electronics', 'Large Appliances', 'Energy Saver', '{"Type":"Double Door","Inverter":"Yes","Capacity":"438L","Cooling":"No Frost"}', NULL, NULL, NULL, '2-4 Days', 'Nationwide', NULL, NULL),

-- Electronics - Cameras
('cam2', 'GoPro Hero 12 Black Action Camera - 5.3K Video', 'GoPro', 135000, 155000, 4.8, 1540, 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', '["https://images.unsplash.com/photo-1502920917128-1aa500764cbd?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"]', TRUE, 'Electronics', 'Cameras', NULL, '{"Video":"5.3K 60fps","Stabilization":"HyperSmooth 6.0","Waterproof":"10m","Battery":"Enduro"}', NULL, NULL, NULL, '2-4 Days', 'Nationwide', NULL, NULL),

-- Electronics - Audio
('aud1', 'Bose QuietComfort Ultra Wireless Earbuds', 'Bose', 88000, 105000, 4.8, 3200, 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=1000&auto=format&fit=crop', '["https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=1000&auto=format&fit=crop"]', TRUE, 'Electronics', 'Audio', NULL, '{"ANC":"Best-in-class","Battery":"6 Hours","Spatial Audio":"Yes","Connectivity":"Bluetooth 5.3"}', NULL, NULL, NULL, '2-4 Days', 'Nationwide', NULL, NULL),

-- Baby & Toys
('bt1', 'LEGO Technic McLaren Senna GTR Racing Sports Car', 'LEGO', 18500, 22000, 4.9, 450, 'https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?q=80&w=1000&auto=format&fit=crop', '["https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?q=80&w=1000&auto=format&fit=crop"]', TRUE, 'Baby & Toys', 'Toys & Games', 'Best Seller', '{}', NULL, NULL, NULL, '2-4 Days', 'Nationwide', NULL, NULL),

('bt2', 'Chicco Bravo Trio Travel System - Stroller & Car Seat', 'Chicco', 85000, 95000, 4.7, 128, 'https://images.unsplash.com/photo-1591123120675-6f7f1aae0e5b?q=80&w=1000&auto=format&fit=crop', '["https://images.unsplash.com/photo-1591123120675-6f7f1aae0e5b?q=80&w=1000&auto=format&fit=crop"]', FALSE, 'Baby & Toys', 'Baby Gear', NULL, '{}', NULL, NULL, NULL, '2-4 Days', 'Nationwide', NULL, NULL),

('bt3', 'Pampers Premium Care Diapers Size 4 (66 Count)', 'Pampers', 4500, 5200, 4.9, 2150, 'https://media.istockphoto.com/id/182079555/photo/pile-of-diapers.webp?a=1&b=1&s=612x612&w=0&k=20&c=-euhx5Z5SbNNheOxQKnOknIi9S7jj02RKw-NVN2jCOo=', '["https://media.istockphoto.com/id/182079555/photo/pile-of-diapers.webp?a=1&b=1&s=612x612&w=0&k=20&c=-euhx5Z5SbNNheOxQKnOknIi9S7jj02RKw-NVN2jCOo="]', TRUE, 'Baby & Toys', 'Diapering', 'Daily Deal', '{}', NULL, NULL, NULL, '2-4 Days', 'Nationwide', NULL, NULL),

('bt4', 'Fisher-Price Deluxe Kick & Play Piano Gym', 'Fisher-Price', 12500, 14000, 4.8, 890, 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?q=80&w=1000&auto=format&fit=crop', '["https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?q=80&w=1000&auto=format&fit=crop"]', TRUE, 'Baby & Toys', 'Toys & Games', NULL, '{}', NULL, NULL, NULL, '2-4 Days', 'Nationwide', NULL, NULL),

('bt5', 'Summer Infant Deluxe Baby Bather - Blue', 'Summer Infant', 3800, 4500, 4.6, 340, 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=1000&auto=format&fit=crop', '["https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=1000&auto=format&fit=crop"]', TRUE, 'Baby & Toys', 'Bath & Skin Care', NULL, '{}', NULL, NULL, NULL, '2-4 Days', 'Nationwide', NULL, NULL),

('bt6', 'Remote Control Rock Crawler 4WD Off-Road Monster Truck', 'Maisto', 7500, 9000, 4.7, 156, 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?q=80&w=1000&auto=format&fit=crop', '["https://images.unsplash.com/photo-1594787318286-3d835c1d207f?q=80&w=1000&auto=format&fit=crop"]', TRUE, 'Baby & Toys', 'Toys & Games', NULL, '{}', NULL, NULL, NULL, '2-4 Days', 'Nationwide', NULL, NULL),

-- Health & Wellness
('hw1', 'Optimum Nutrition Gold Standard Whey Protein 5lbs', 'ON', 24500, 28000, 4.8, 3200, 'https://media.istockphoto.com/id/2164388558/photo/close-up-of-protein-powder-in-scoop-on-table.webp?a=1&b=1&s=612x612&w=0&k=20&c=BFdF5TxmrF9--Qo4n2j72VEsS7fSAmKSqgkHmsoemrI=', '["https://media.istockphoto.com/id/2164388558/photo/close-up-of-protein-powder-in-scoop-on-table.webp?a=1&b=1&s=612x612&w=0&k=20&c=BFdF5TxmrF9--Qo4n2j72VEsS7fSAmKSqgkHmsoemrI="]', TRUE, 'Health & Wellness', 'Supplements', 'Authentic', '{}', NULL, NULL, NULL, '2-4 Days', 'Nationwide', NULL, NULL),

-- Sports & Fitness
('sf1', 'Professional CA Plus 15000 Cricket Bat', 'CA Sports', 45000, 52000, 4.9, 215, 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=1000&auto=format&fit=crop', '["https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=1000&auto=format&fit=crop"]', TRUE, 'Sports & Fitness', 'Team Sports', 'Pro Grade', '{}', NULL, NULL, NULL, '2-4 Days', 'Nationwide', NULL, NULL),

-- Automotive
('au1', 'Michelin Pilot Sport 4S High Performance Tire', 'Michelin', 38000, 42000, 4.8, 95, 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?q=80&w=1000&auto=format&fit=crop', '["https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?q=80&w=1000&auto=format&fit=crop"]', FALSE, 'Automotive', 'Parts & Tools', NULL, '{}', NULL, NULL, NULL, '2-4 Days', 'Nationwide', NULL, NULL),

-- Fashion
('f1', 'Nike Air Max Pulse Lifestyle Sneakers', 'Nike', 45000, 55000, 4.9, 8600, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1000&auto=format&fit=crop', '["https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1000&auto=format&fit=crop"]', TRUE, 'Fashion', 'Footwear', 'Flash Sale', '{}', NULL, NULL, NULL, '2-4 Days', 'Nationwide', NULL, NULL),

('f2', 'Adidas Ultraboost Light Running Shoes', 'Adidas', 42000, 48000, 4.8, 1200, 'https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?q=80&w=1000&auto=format&fit=crop', '["https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?q=80&w=1000&auto=format&fit=crop"]', TRUE, 'Fashion', 'Footwear', NULL, '{}', NULL, NULL, NULL, '2-4 Days', 'Nationwide', NULL, NULL),

-- Home
('h1', 'Royal Wall Mirror - Gold Frame Luxe Decor', 'DecoHome', 12500, 15000, 4.7, 45, 'https://images.unsplash.com/photo-1618220179428-22790b461013?q=80&w=1000&auto=format&fit=crop', '["https://images.unsplash.com/photo-1618220179428-22790b461013?q=80&w=1000&auto=format&fit=crop"]', TRUE, 'Home', 'Home Decor', 'Trending', '{}', NULL, NULL, NULL, '2-4 Days', 'Nationwide', NULL, NULL),

('h2', 'Dyson V15 Detect Cordless Vacuum Cleaner', 'Dyson', 145000, 165000, 5.0, 12, 'https://images.unsplash.com/photo-1558317374-067fb5f30001?q=80&w=1000&auto=format&fit=crop', '["https://images.unsplash.com/photo-1558317374-067fb5f30001?q=80&w=1000&auto=format&fit=crop"]', TRUE, 'Home', 'Small Appliances', NULL, '{}', NULL, NULL, NULL, '2-4 Days', 'Nationwide', 20, 125000),

('h3', 'Bosch 18V Cordless Hammer Drill Set', 'Bosch', 28500, 32000, 4.9, 88, 'https://images.unsplash.com/photo-1504148455328-c376907d081c?q=80&w=1000&auto=format&fit=crop', '["https://images.unsplash.com/photo-1504148455328-c376907d081c?q=80&w=1000&auto=format&fit=crop"]', TRUE, 'Home', 'Tools & Home Improvement', NULL, '{}', NULL, NULL, NULL, '2-4 Days', 'Nationwide', NULL, NULL)

ON CONFLICT (id) DO NOTHING;

-- Seed a sample promotion
INSERT INTO promotions (id, name, discount_percentage, start_date, end_date, status, type, min_purchase, merchant_id)
VALUES ('PR-abc123xyz', 'Spring Flash Sale', 10, NOW(), NOW() + INTERVAL '7 days', 'Active', 'Flash Sale', 0, NULL)
ON CONFLICT (id) DO NOTHING;
