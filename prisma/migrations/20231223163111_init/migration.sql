-- CreateTable
CREATE TABLE "Post" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "userID" SERIAL NOT NULL,
    "password" TEXT,
    "surname" TEXT,
    "mobile" TEXT,
    "addressGreaterArea" TEXT,
    "addressStreet" TEXT,
    "addressStreetCode" TEXT,
    "addressStreetNumber" TEXT,
    "addressSuburb" TEXT,
    "addressPostalCode" TEXT,
    "preferredCommunication" TEXT,
    "role" TEXT,
    "status" TEXT,
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "petOwner" (
    "ownerID" SERIAL NOT NULL,
    "firstName" TEXT NOT NULL,
    "surname" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "addressGreaterArea" TEXT NOT NULL,
    "addressStreet" TEXT NOT NULL,
    "addressStreetCode" TEXT NOT NULL,
    "addressStreetNumber" TEXT NOT NULL,
    "addressSuburb" TEXT NOT NULL,
    "addressPostalCode" TEXT NOT NULL,
    "preferredCommunication" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "comments" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "petOwner_pkey" PRIMARY KEY ("ownerID")
);

-- CreateTable
CREATE TABLE "pet" (
    "petID" SERIAL NOT NULL,
    "petName" TEXT NOT NULL,
    "ownerID" INTEGER NOT NULL,
    "species" TEXT NOT NULL,
    "sex" TEXT NOT NULL,
    "age" TEXT NOT NULL,
    "breed" TEXT NOT NULL,
    "colour" TEXT NOT NULL,
    "markings" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "sterilisedStatus" TEXT NOT NULL,
    "sterilisedRequested" TEXT NOT NULL,
    "sterilisedRequestSigned" TEXT NOT NULL,
    "vaccinatedStatus" TEXT NOT NULL,
    "treatments" TEXT NOT NULL,
    "clinicsAttended" TEXT[],
    "lastDeworming" TEXT NOT NULL,
    "membership" TEXT NOT NULL,
    "cardStatus" TEXT NOT NULL,
    "kennelReceived" TEXT NOT NULL,
    "comments" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pet_pkey" PRIMARY KEY ("petID")
);

-- CreateTable
CREATE TABLE "petClinic" (
    "clinicID" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "greaterArea" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "conditions" TEXT NOT NULL,
    "comments" TEXT NOT NULL,

    CONSTRAINT "petClinic_pkey" PRIMARY KEY ("clinicID")
);

-- CreateTable
CREATE TABLE "petTreatment" (
    "treatmentID" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "petID" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "comments" TEXT NOT NULL,

    CONSTRAINT "petTreatment_pkey" PRIMARY KEY ("treatmentID")
);

-- CreateTable
CREATE TABLE "volunteer" (
    "volunteerID" SERIAL NOT NULL,
    "firstName" TEXT NOT NULL,
    "surname" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "addressGreaterArea" TEXT NOT NULL,
    "addressStreet" TEXT NOT NULL,
    "addressStreetCode" TEXT NOT NULL,
    "addressStreetNumber" TEXT NOT NULL,
    "addressSuburb" TEXT NOT NULL,
    "addressPostalCode" TEXT NOT NULL,
    "preferredCommunication" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "clinicsAttended" TEXT[],
    "comments" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "volunteer_pkey" PRIMARY KEY ("volunteerID")
);

-- CreateIndex
CREATE INDEX "Post_name_idx" ON "Post"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pet" ADD CONSTRAINT "pet_ownerID_fkey" FOREIGN KEY ("ownerID") REFERENCES "petOwner"("ownerID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "petTreatment" ADD CONSTRAINT "petTreatment_petID_fkey" FOREIGN KEY ("petID") REFERENCES "pet"("petID") ON DELETE RESTRICT ON UPDATE CASCADE;
