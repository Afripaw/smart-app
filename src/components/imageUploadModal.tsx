//import React, { useEffect } from "react";

import { UploadButton } from "~/utils/uploadthing";
import { UserCircle } from "phosphor-react";
import Image from "next/image";
import { api } from "~/utils/api";

interface ImageUploadModalProps {
  isOpen: boolean;
  userID: string;
  userType: string;
  userName: string;
  userImage: string;
  onClose: () => void;
}

const ImageUploadModal: React.FC<ImageUploadModalProps> = ({ isOpen, userName, userID, userImage, userType, onClose }) => {
  const user = api.user.getUserByID.useQuery({ id: userID });
  if (!isOpen) return null;

  if (userImage === "") {
    userImage = user.data?.image ?? "";
    // userImage = "https://res.cloudinary.com/dk-find-out/image/upload/q_80,w_1920,f_auto/DCTM_Penguin_UK_DK_AL552958_hygtqo.jpg";
  }
  return (
    <div className="fixed inset-0 z-20 flex h-full w-full items-center justify-center overflow-y-auto bg-gray-600 bg-opacity-50">
      <div className="flex flex-col justify-center rounded-lg bg-white p-4 shadow-md">
        <div className="flex justify-center">
          <h1 className="mb-3 text-3xl font-semibold">Upload Image</h1>
        </div>
        <h2 className="mb-2 text-lg font-semibold">Would you like to upload an image for {userName}?</h2>
        <div className="flex justify-center">
          <div>
            {userImage ? (
              <Image src={userImage} alt="Afripaw profile pic" className="ml-auto aspect-auto " width={140} height={100} />
            ) : (
              <UserCircle size={140} className="ml-auto aspect-auto border-2" />
            )}
          </div>
        </div>
        <div className="flex flex-col justify-around">
          <UploadButton
            className="mt-4 px-4 py-2 text-white ut-button:bg-main-orange ut-button:focus:bg-orange-500 ut-button:active:bg-orange-500 ut-button:disabled:bg-orange-500 ut-label:hover:bg-orange-500"
            endpoint="imageUploader"
            input={{ userId: userID ?? "", user: userType ?? "" }}
            onUploadError={(error: Error) => {
              // Do something with the error.
              alert(`ERROR! ${error.message}`);
            }}
            onClientUploadComplete={() => {
              // run function to update user with new image
              // console.log("Response: " + response);
              console.log("Upload complete!!!!!!!!");
              void user.refetch();
            }}
          />
          <button className="mt-6 rounded bg-main-orange px-4 py-1 text-white hover:bg-orange-500" onClick={onClose}>
            Close and continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageUploadModal;
