USE catCafe;
--
-- Dumping data for table actor
--

SET AUTOCOMMIT=0;
INSERT INTO Cats (name, age, personality) VALUES
('Bolillo',2,'Calm and loves sleeping'),
('Capuchino',3,'Very playful and curious'),
('Croquetito',1,'Friendly and very active'),
('Don Bigotes',4,'Quiet, elegant and wise'),
('Pancracio',2,'Very affectionate and sweet');
COMMIT;

SET AUTOCOMMIT=0;
INSERT INTO MenuItems (item, price, dayOfWeek) VALUES
('Latte',67.00,'Mon'),
('Cake',50.00,'Mon'),
('Tea',40.00,'Tue'),
('Cookie',30.00,'Tue'),
('Hot Cocoa',35.0,'Wed'),
('Brownie',45.00,'Wed'),
('Mocha',65.00,'Thu'),
('Sandwich',70.0,'Thu'),
('Espresso',50.00,'Fri'),
('Donut',40.00,'Fri'),
('Cold Brew',75.00,'Sat'),
('Waffle',80.00,'Sat'),
('Milk Tea',55.00,'Sun'),
('Croissant',60.0,'Sun');

COMMIT;