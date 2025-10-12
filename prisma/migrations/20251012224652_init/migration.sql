-- CreateTable
CREATE TABLE `Users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `doc` VARCHAR(191) NOT NULL,
    `birthDate` DATETIME(3) NOT NULL,
    `password` VARCHAR(191) NULL,
    `vcHash` VARCHAR(191) NULL,
    `ifHash` VARCHAR(191) NULL,
    `auth_sub` VARCHAR(191) NULL,
    `role` VARCHAR(191) NULL,
    `classCode` CHAR(1) NOT NULL,

    UNIQUE INDEX `Users_doc_key`(`doc`),
    UNIQUE INDEX `Users_vcHash_key`(`vcHash`),
    UNIQUE INDEX `Users_ifHash_key`(`ifHash`),
    UNIQUE INDEX `Users_auth_sub_key`(`auth_sub`),
    INDEX `Users_classCode_idx`(`classCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Requests` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `from_aa` VARCHAR(191) NOT NULL,
    `to_aa` VARCHAR(191) NOT NULL,
    `message` VARCHAR(191) NULL,
    `types_needed_json` VARCHAR(191) NULL,
    `types_granted_json` VARCHAR(191) NULL,
    `date_request` DATETIME(3) NULL,
    `date_response` DATETIME(3) NULL,

    INDEX `Requests_to_aa_date_response_idx`(`to_aa`, `date_response`),
    INDEX `Requests_from_aa_to_aa_date_response_idx`(`from_aa`, `to_aa`, `date_response`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
