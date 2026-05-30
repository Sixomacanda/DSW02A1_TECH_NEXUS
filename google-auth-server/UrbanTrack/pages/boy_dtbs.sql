-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 09, 2026 at 11:06 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `boy_dtbs`
--

-- --------------------------------------------------------

--
-- Table structure for table `boy_table`
--

CREATE TABLE `boy_table` (
  `Surname` varchar(34) NOT NULL,
  `Email` varchar(100) NOT NULL,
  `Password` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `boy_table`
--

INSERT INTO `boy_table` (`Surname`, `Email`, `Password`) VALUES
('NDONYELA', 'ndonyelamlekeleli36@gmail.com', 'Mlekeleli36@meh'),
('Mthiyane', 'Zethembe@gmail.c', 'Mlekeleli36@meh'),
('Mthiyane', 'Zethembe@gmail.co', 'Mlekeleli36@meh'),
('Mthiyane', 'Zethembe@gmail.com', 'Zethembe36@meh');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `boy_table`
--
ALTER TABLE `boy_table`
  ADD PRIMARY KEY (`Email`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
