-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: mysql
-- Generation Time: Apr 01, 2026 at 02:49 PM
-- Server version: 9.6.0
-- PHP Version: 8.3.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `TechJob`
--

-- --------------------------------------------------------

--
-- Table structure for table `material`
--

CREATE TABLE `material` (
  `material_id` int NOT NULL,
  `material_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` int DEFAULT '0',
  `unit` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'ชิ้น',
  `status` enum('มี','หมด') COLLATE utf8mb4_unicode_ci DEFAULT 'มี',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `material`
--

INSERT INTO `material` (`material_id`, `material_code`, `name`, `quantity`, `unit`, `status`, `created_at`) VALUES
(1, NULL, 'สายไฟ 2.5 ตารางมิลลิเมตร', 100, 'เมตร', 'มี', '2026-03-24 04:01:52'),
(2, NULL, 'ท่อ PVC ขนาด 1 นิ้ว', 50, 'เส้น', 'มี', '2026-03-24 04:01:52'),
(3, NULL, 'สวิตช์ไฟ', 30, 'ชิ้น', 'มี', '2026-03-24 04:01:52'),
(4, NULL, 'ปั๊มน้ำ', 5, 'ตัว', 'มี', '2026-03-24 04:01:52'),
(5, NULL, 'กาวท่อ', 20, 'หลอด', 'มี', '2026-03-24 04:01:52');

-- --------------------------------------------------------

--
-- Table structure for table `material_request`
--

CREATE TABLE `material_request` (
  `request_id` int NOT NULL,
  `work_id` int NOT NULL,
  `technician_id` int NOT NULL,
  `material_id` int NOT NULL,
  `quantity` int NOT NULL,
  `status` enum('รออนุมัติ','อนุมัติ','ไม่อนุมัติ') COLLATE utf8mb4_unicode_ci DEFAULT 'รออนุมัติ',
  `note` text COLLATE utf8mb4_unicode_ci,
  `admin_note` text COLLATE utf8mb4_unicode_ci,
  `request_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `approve_at` datetime DEFAULT NULL,
  `admin_id` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int NOT NULL,
  `username` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('admin','supervisor','technician') COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('ว่าง','มีงาน','ลา') COLLATE utf8mb4_unicode_ci DEFAULT 'ว่าง',
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `department` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `supervisor_id` int DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `username`, `password`, `name`, `role`, `type`, `status`, `email`, `phone`, `department`, `supervisor_id`, `created_at`) VALUES
(1, 'admin', '$2a$10$hI77Je/fsuRnsKLxzwS1z.xZt1FB/1sU.Fsn95NnStScEVjutRCey', 'name1', 'admin', NULL, 'ว่าง', 'new123@mail.com', '0123', '111', NULL, '2026-03-24 04:01:52'),
(2, 'supervisor01', '$2a$10$fAHcuMA6axO.yowh6wNP8Ojad5zBhOSzbBZa6aa4vGcOu6b2C5tiS', 'สมชาย ใจดี', 'supervisor', NULL, 'ว่าง', 'somchai@techjob.com', '081-000-0002', 'ไฟฟ้า', NULL, '2026-03-24 04:01:52'),
(3, 'supervisor02', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'deweiei', 'supervisor', NULL, 'ว่าง', 'new@mail.com', '0022', '111', NULL, '2026-03-24 04:01:52'),
(4, 'tech01', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'มานะ ขยันดี', 'technician', 'ช่างไฟฟ้า', 'ว่าง', 'mana@techjob.com', '081-000-0004', NULL, 2, '2026-03-24 04:01:52'),
(5, 'tech02', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'วิชัย ตั้งใจ', 'technician', 'ช่างไฟฟ้า', 'ว่าง', 'wichai@techjob.com', '081-000-0005', NULL, 2, '2026-03-24 04:01:52'),
(7, 'user01', '$2a$10$iXBHe8jQqQ6xu.toCE8sce5gyXC9MrBKqc/AAsSoAyyGfFWBZb/te', 'John Doe', 'technician', NULL, 'ว่าง', 'john@mail.com', NULL, NULL, NULL, '2026-03-25 07:46:03');

-- --------------------------------------------------------

--
-- Table structure for table `work`
--

CREATE TABLE `work` (
  `work_id` int NOT NULL,
  `job_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `job_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `job_detail` text COLLATE utf8mb4_unicode_ci,
  `location` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `work_time` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `problem_report` text COLLATE utf8mb4_unicode_ci,
  `status` enum('รอดำเนินการ','มอบหมายแล้ว','กำลังดำเนินการ','รอตรวจงาน','เสร็จสิ้น','ส่งกลับแก้ไข') COLLATE utf8mb4_unicode_ci DEFAULT 'รอดำเนินการ',
  `admin_id` int NOT NULL,
  `supervisor_id` int NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `work`
--

INSERT INTO `work` (`work_id`, `job_name`, `customer_name`, `job_type`, `job_detail`, `location`, `start_date`, `work_time`, `problem_report`, `status`, `admin_id`, `supervisor_id`, `created_at`, `updated_at`) VALUES
(1, 'ชื่อโครงการใหม่', 'ชื่อลูกค้า', 'ประเภทงาน', 'รายละเอียด', 'สถานที่', '2024-03-25', '10:00', NULL, 'รอดำเนินการ', 1, 1, '2026-03-24 10:08:10', '2026-03-25 05:25:29'),
(8, 'งานซ่อมบำรุง', 'คุณสมชาย', 'ไฟฟ้า', 'ไฟดับชั้น 2', 'ตึก A', '2024-03-25', '09:00', NULL, 'มอบหมายแล้ว', 1, 1, '2026-03-25 05:24:40', '2026-03-25 08:18:39'),
(9, 'งานซ่อมบำรุง', 'คุณสมชาย', 'ไฟฟ้า', 'ไฟดับชั้น 2', 'ตึก A', '2024-03-25', '09:00', NULL, 'รอดำเนินการ', 1, 1, '2026-03-25 05:38:18', '2026-03-25 05:38:18');

-- --------------------------------------------------------

--
-- Table structure for table `work_assign`
--

CREATE TABLE `work_assign` (
  `assign_id` int NOT NULL,
  `work_id` int NOT NULL,
  `technician_id` int NOT NULL,
  `assigned_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `status` enum('รับงาน','กำลังทำ','ส่งตรวจ','ผ่าน','ส่งกลับ') COLLATE utf8mb4_unicode_ci DEFAULT 'รับงาน',
  `tech_note` text COLLATE utf8mb4_unicode_ci,
  `supervisor_note` text COLLATE utf8mb4_unicode_ci,
  `finished_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `work_assign`
--

INSERT INTO `work_assign` (`assign_id`, `work_id`, `technician_id`, `assigned_at`, `status`, `tech_note`, `supervisor_note`, `finished_at`) VALUES
(1, 1, 5, '2026-03-25 05:25:07', 'ผ่าน', NULL, NULL, NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `material`
--
ALTER TABLE `material`
  ADD PRIMARY KEY (`material_id`),
  ADD UNIQUE KEY `material_code` (`material_code`);

--
-- Indexes for table `material_request`
--
ALTER TABLE `material_request`
  ADD PRIMARY KEY (`request_id`),
  ADD KEY `fk_req_work` (`work_id`),
  ADD KEY `fk_req_tech` (`technician_id`),
  ADD KEY `fk_req_material` (`material_id`),
  ADD KEY `fk_req_admin` (`admin_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `fk_users_supervisor` (`supervisor_id`);

--
-- Indexes for table `work`
--
ALTER TABLE `work`
  ADD PRIMARY KEY (`work_id`),
  ADD KEY `fk_work_admin` (`admin_id`),
  ADD KEY `fk_work_supervisor` (`supervisor_id`);

--
-- Indexes for table `work_assign`
--
ALTER TABLE `work_assign`
  ADD PRIMARY KEY (`assign_id`),
  ADD KEY `fk_assign_work` (`work_id`),
  ADD KEY `fk_assign_tech` (`technician_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `material`
--
ALTER TABLE `material`
  MODIFY `material_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `material_request`
--
ALTER TABLE `material_request`
  MODIFY `request_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `work`
--
ALTER TABLE `work`
  MODIFY `work_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `work_assign`
--
ALTER TABLE `work_assign`
  MODIFY `assign_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `material_request`
--
ALTER TABLE `material_request`
  ADD CONSTRAINT `fk_req_admin` FOREIGN KEY (`admin_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `fk_req_material` FOREIGN KEY (`material_id`) REFERENCES `material` (`material_id`),
  ADD CONSTRAINT `fk_req_tech` FOREIGN KEY (`technician_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `fk_req_work` FOREIGN KEY (`work_id`) REFERENCES `work` (`work_id`);

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `fk_users_supervisor` FOREIGN KEY (`supervisor_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

--
-- Constraints for table `work`
--
ALTER TABLE `work`
  ADD CONSTRAINT `fk_work_admin` FOREIGN KEY (`admin_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `fk_work_supervisor` FOREIGN KEY (`supervisor_id`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `work_assign`
--
ALTER TABLE `work_assign`
  ADD CONSTRAINT `fk_assign_tech` FOREIGN KEY (`technician_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `fk_assign_work` FOREIGN KEY (`work_id`) REFERENCES `work` (`work_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
