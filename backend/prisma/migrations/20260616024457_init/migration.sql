-- CreateEnum
CREATE TYPE "AppRole" AS ENUM ('admin', 'jefe_quirofano', 'medico', 'administrativo', 'enfermero', 'familiar');

-- CreateEnum
CREATE TYPE "SurgeryStatus" AS ENUM ('programada', 'ingreso', 'preoperatorio', 'en_quirofano', 'recuperacion', 'postoperatorio', 'alta', 'cancelada');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "AppRole" NOT NULL,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3),
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "bloodType" TEXT,
    "allergies" TEXT,
    "notes" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperatingRoom" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "floor" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperatingRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Surgery" (
    "id" TEXT NOT NULL,
    "publicCode" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "operatingRoomId" TEXT,
    "procedure" TEXT NOT NULL,
    "surgeonName" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "status" "SurgeryStatus" NOT NULL DEFAULT 'programada',
    "priority" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Surgery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurgeryStatusHistory" (
    "id" TEXT NOT NULL,
    "surgeryId" TEXT NOT NULL,
    "status" "SurgeryStatus" NOT NULL,
    "changedBy" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SurgeryStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pendiente',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "UserRole_userId_idx" ON "UserRole"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserRole_userId_role_key" ON "UserRole"("userId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_documentId_key" ON "Patient"("documentId");

-- CreateIndex
CREATE INDEX "Patient_lastName_firstName_idx" ON "Patient"("lastName", "firstName");

-- CreateIndex
CREATE UNIQUE INDEX "OperatingRoom_code_key" ON "OperatingRoom"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Surgery_publicCode_key" ON "Surgery"("publicCode");

-- CreateIndex
CREATE INDEX "Surgery_scheduledAt_idx" ON "Surgery"("scheduledAt");

-- CreateIndex
CREATE INDEX "Surgery_status_idx" ON "Surgery"("status");

-- CreateIndex
CREATE INDEX "SurgeryStatusHistory_surgeryId_idx" ON "SurgeryStatusHistory"("surgeryId");

-- CreateIndex
CREATE INDEX "Appointment_scheduledAt_idx" ON "Appointment"("scheduledAt");

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Surgery" ADD CONSTRAINT "Surgery_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Surgery" ADD CONSTRAINT "Surgery_operatingRoomId_fkey" FOREIGN KEY ("operatingRoomId") REFERENCES "OperatingRoom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurgeryStatusHistory" ADD CONSTRAINT "SurgeryStatusHistory_surgeryId_fkey" FOREIGN KEY ("surgeryId") REFERENCES "Surgery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurgeryStatusHistory" ADD CONSTRAINT "SurgeryStatusHistory_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
