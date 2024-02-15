import { type NextPage } from "next";
import Head from "next/head";
import React, { SetStateAction, useEffect, useRef, useState } from "react";
import { api } from "~/utils/api";
import ReactToPrint from "react-to-print";
import Image from "next/image";
import { useRouter } from "next/router";
//Components
import Navbar from "../components/navbar";
import CreateButtonModal from "../components/createButtonModal";
import DeleteButtonModal from "~/components/deleteButtonModal";
import { areaOptions } from "~/components/GeoLocation/areaOptions";

//Icons
import { AddressBook, Pencil, Dog, Printer, Trash, UserCircle, Users } from "phosphor-react";

//Date picker
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

//Communication
import { sendSMS } from "~/pages/api/smsPortal";

import { UploadButton } from "~/utils/uploadthing";
import { useSession } from "next-auth/react";
import Input from "~/components/Base/Input";
import { bg } from "date-fns/locale";
import { set } from "date-fns";
import { router } from "@trpc/server";

const Communication: NextPage = () => {
  //useSession({ required: true });

  const newCommunication = api.communication.create.useMutation();
  //const updateClinic = api.petClinic.update.useMutation();
  //const [isUpdate, setIsUpdate] = useState(false);
  const [isCreate, setIsCreate] = useState(false);
  //Update the table when user is deleted
  const [isDeleted, setIsDeleted] = useState(false);

  //For moving between different pages
  const router = useRouter();

  //-------------------------------EMAILS-----------------------------------------
  async function sendEmail(message: string, email: string): Promise<void> {
    const response = await fetch("/api/generalEmails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message, email }),
    });
    console.log("response: ", response);

    if (!response.ok) {
      console.error("Failed to send email");
      // Attempt to parse the response to get the error message
      try {
        const errorData = (await response.json()) as { message?: string };
        throw new Error(errorData.message ?? "Failed to send email");
      } catch (error) {
        // If parsing fails, throw a generic error
        throw new Error("Failed to send email");
      }
    }

    // Attempt to parse the successful response
    try {
      const responseData = (await response.json()) as { message: string; data?: unknown };
      console.log("responseData: ", responseData);
      // Handle the successful response as needed. For example, log the message or use the data.
      console.log(responseData.message); // Log the success message
      // Optionally, you can do something with responseData.data if your API returns additional data
    } catch (error) {
      // If parsing fails or the response structure isn't as expected, handle or log the error
      console.error("Error parsing response data", error);
      throw new Error("Error processing the server response");
    }
  }

  //-------------------------------SEARCH BAR------------------------------------
  //Query the users table
  const [query, setQuery] = useState("");

  const getQueryFromSearchPhrase = (searchPhrase: string) => {
    // dirk b, jack -> (+dirk +b) (+jack)
    const phrase = searchPhrase
      .replaceAll(/[()|&:*!"\-+]/gi, " ")
      .trim()
      .split(",")
      .filter((v) => v)
      .map((v) => "(+" + v.trim().split(" ").join("* +") + "*)")
      .join(" ");

    console.log(phrase);

    return phrase;
  };

  //-------------------------------TABLE-----------------------------------------
  //const data = api.user.searchUsers.useQuery({ searchQuery: query });
  //delete specific row
  const deleteRow = api.communication.deleteCommunication.useMutation();
  const handleDeleteRow = async (id: number) => {
    setIsDeleteModalOpen(false);
    await deleteRow.mutateAsync({ communicationID: id });
    isDeleted ? setIsDeleted(false) : setIsDeleted(true);
  };

  //autoload the table
  /* useEffect(() => {
    void data.refetch();
  }, [isUpdate, isDeleted, isCreate]);*/

  //-------------------------------ID-----------------------------------------
  const [id, setID] = useState(0);

  //-----------------------------SUCCESS-----------------------------------------
  //Success fields
  const [success, setSuccess] = useState("No");

  //----------------------------TYPE OF MESSAGE-----------------------------------------
  //Type of message fields
  //const [type, setType] = useState("Email");

  //-------------------------------ORDER-----------------------------------------
  //Order fields
  //sorts the table according to specific fields
  const [order, setOrder] = useState("date");

  //-------------------------------ALL USERS, PET OWNERS AND VOLUNTEERS-----------------------------------------
  //All users, pet owners and volunteers
  // const allUsers = api.communication.getAllUsers.useQuery();
  // const allPetOwners = api.communication.getAllPetOwners.useQuery();
  // const allVolunteers = api.communication.getAllVolunteers.useQuery();

  //-------------------------------INFINITE SCROLLING WITH INTERSECTION OBSERVER-----------------------------------------
  const observerTarget = useRef<HTMLDivElement | null>(null);

  const [limit] = useState(12);
  const {
    data: queryData,
    fetchNextPage,
    hasNextPage,
    refetch,
  } = api.communication.searchCommunicationsInfinite.useInfiniteQuery(
    {
      communicationID: id,
      limit: limit,
      searchQuery: query,
      order: order,
    },
    {
      getNextPageParam: (lastPage) => {
        console.log("Next Cursor: " + lastPage.nextCursor);
        return lastPage.nextCursor;
      },
      enabled: false,
    },
  );

  //Flattens the pages array into one array
  const user_data = queryData?.pages.flatMap((page) => page.user_data);

  //Checks intersection of the observer target and reassigns target element once true
  useEffect(() => {
    if (!observerTarget.current || !fetchNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage) void fetchNextPage();
      },
      { threshold: 1 },
    );

    if (observerTarget.current) observer.observe(observerTarget.current);

    const currentTarget = observerTarget.current;

    return () => {
      if (currentTarget) observer.unobserve(currentTarget);
    };
  }, [fetchNextPage, hasNextPage, observerTarget]);

  //Make it retrieve the data from tab;e again when the user is updated, deleted or created
  useEffect(() => {
    void refetch();
  }, [isDeleted, isCreate, query, order]);

  const communication = user_data?.find((communication) => communication.communicationID === id);

  //-------------------------------DELETE ALL USERS-----------------------------------------
  //Delete all users
  const deleteAllUsers = api.communication.deleteAllCommunications.useMutation();
  const handleDeleteAllUsers = async () => {
    await deleteAllUsers.mutateAsync();
    isDeleted ? setIsDeleted(false) : setIsDeleted(true);
  };

  //---------------------------------PRINTING----------------------------------
  const printComponentRef = useRef(null);

  //---------------------------------UPDATE AT----------------------------------
  const [updatedAt, setUpdatedAt] = useState(new Date());

  //---------------------------------EDIT BOXES----------------------------------
  const [message, setMessage] = useState("");
  const [includeUser, setIncludeUser] = useState(false);
  const [includePetOwner, setIncludePetOwner] = useState(false);
  const [includeVolunteer, setIncludeVolunteer] = useState(false);
  //const [startingDate, setStartingDate] = useState(new Date());
  //const [image, setImage] = useState("");

  //userID
  //const [userID, setUserID] = useState("");
  // const [id, setID] = useState(0);

  //-------------------------------UPDATE USER-----------------------------------------
  // const clinic = api.petClinic.getClinicByID.useQuery({ clinicID: id });

  //Order fields
  //sorts the table according to specific fields
  //const [order, setOrder] = useState("date");

  //--------------------------------CREATE NEW USER DROPDOWN BOXES--------------------------------
  //WEBHOOKS FOR DROPDOWN BOXES
  const [isGreaterAreaOpen, setIsGreaterAreaOpen] = useState(false);
  const [greaterAreaOption, setGreaterAreaOption] = useState("Select one");
  const greaterAreaRef = useRef<HTMLDivElement>(null);
  const btnGreaterAreaRef = useRef<HTMLButtonElement>(null);

  const [isAreaOpen, setIsAreaOpen] = useState(false);
  const [areaOption, setAreaOption] = useState("Select one");
  const areaRef = useRef<HTMLDivElement>(null);
  const btnAreaRef = useRef<HTMLButtonElement>(null);

  const [preferredCommunication, setPreferredCommunication] = useState(false);
  const [preferredOption, setPreferredCommunicationOption] = useState("Select one");
  const preferredCommunicationRef = useRef<HTMLDivElement>(null);
  const btnPreferredCommunicationRef = useRef<HTMLButtonElement>(null);

  //GREATER AREA USERS
  //to select multiple areas
  const [greaterAreaList, setGreaterAreaList] = useState<string[]>([]);
  const handleToggleGreaterArea = () => {
    setIsGreaterAreaOpen(!isGreaterAreaOpen);
  };

  const handleGreaterAreaOption = (option: SetStateAction<string>) => {
    setGreaterAreaOption(option);
    setIsGreaterAreaOpen(false);
    if (!greaterAreaList.includes(String(option))) {
      setGreaterAreaList([...greaterAreaList, String(option)]);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        greaterAreaRef.current &&
        !greaterAreaRef.current.contains(event.target as Node) &&
        btnGreaterAreaRef.current &&
        !btnGreaterAreaRef.current.contains(event.target as Node)
      ) {
        setIsGreaterAreaOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const greaterAreaOptions = ["Flagship", "Replication area 1", "Replication area 2"];

  //show all the clinics that the volunteer attended
  const [showGreaterArea, setShowGreaterArea] = useState(false);
  const handleShowGreaterArea = () => {
    setShowGreaterArea(!showGreaterArea);
  };

  //AREA
  //to select multiple areas
  const [areaList, setAreaList] = useState<string[]>([]);
  const handleToggleArea = () => {
    setIsAreaOpen(!isAreaOpen);
  };

  const handleAreaOption = (option: SetStateAction<string>) => {
    setAreaOption(option);
    setIsAreaOpen(false);
    if (!areaList.includes(String(option))) {
      setAreaList([...areaList, String(option)]);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (areaRef.current && !areaRef.current.contains(event.target as Node) && btnAreaRef.current && !btnAreaRef.current.contains(event.target as Node)) {
        setIsAreaOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  //show all the clinics that the volunteer attended
  const [showArea, setShowArea] = useState(false);
  const handleShowArea = () => {
    setShowArea(!showGreaterArea);
  };

  //PREFERRED COMMUNICATION
  const handleTogglePreferredCommunication = () => {
    setPreferredCommunication(!preferredCommunication);
  };

  const handlePreferredCommunicationOption = (option: SetStateAction<string>) => {
    setPreferredCommunicationOption(option);
    setPreferredCommunication(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        preferredCommunicationRef.current &&
        !preferredCommunicationRef.current.contains(event.target as Node) &&
        btnPreferredCommunicationRef.current &&
        !btnPreferredCommunicationRef.current.contains(event.target as Node)
      ) {
        setPreferredCommunication(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const preferredCommunicationOptions = ["Email", "SMS"];

  //-------------------------------CREATE NEW USER-----------------------------------------

  const handleCreateNewUser = async () => {
    setGreaterAreaOption("Select one");
    setAreaOption("Select one");

    // setStartingDate(new Date());
    setMessage("");
    //isCreate ? setIsCreate(false) : setIsCreate(true);
    setIsCreate(true);
  };
  //-------------------------------NEW USER-----------------------------------------

  const handleNewUser = async () => {
    //All users, pet owners and volunteers
    const allUsers = api.communication.getAllUsers.useQuery({ greaterArea: greaterAreaList, area: areaList });
    const allPetOwners = api.communication.getAllPetOwners.useQuery({ greaterArea: greaterAreaList, area: areaList });
    const allVolunteers = api.communication.getAllVolunteers.useQuery({ greaterArea: greaterAreaList, area: areaList });

    const [userSuccess, setUserSuccess] = useState("No");
    const [petOwnerSuccess, setPetOwnerSuccess] = useState("No");
    const [volunteerSuccess, setVolunteerSuccess] = useState("No");
    //Send user details

    //Email
    if (preferredOption === "Email") {
      //loop through all the users and send them an email
      allUsers?.data?.map(async (user) => {
        const email = user?.email ?? "";
        //do a try catch statement here
        try {
          await sendEmail(message, email);
          console.log("Email sent successfully");
          setUserSuccess("Yes");
        } catch (error) {
          console.error("Failed to send email", error);
          setUserSuccess("No");
        }
        //await sendEmail(message, email);
      });

      //loop through all the pet owners and send them an email
      allPetOwners?.data?.map(async (petOwner) => {
        const email = petOwner?.email ?? "";
        //do a try statement here
        try {
          await sendEmail(message, email);
          console.log("Email sent successfully");
          setPetOwnerSuccess("Yes");
        } catch (error) {
          console.error("Failed to send email", error);
          setPetOwnerSuccess("No");
        }
        // await sendEmail(message, email);
      });

      //loop through all the volunteers and send them an email
      allVolunteers?.data?.map(async (volunteer) => {
        const email = volunteer?.email ?? "";
        //do a ttry statement here
        try {
          await sendEmail(message, email);
          console.log("Email sent successfully");
          setVolunteerSuccess("Yes");
        } catch (error) {
          console.error("Failed to send email", error);
          setVolunteerSuccess("No");
        }
        //await sendEmail(message, email);
      });
      //await sendEmail(message, email);
    }
    //SMS
    if (preferredOption === "SMS") {
      //const messageContent = "Afripaw Smart App Login Credentials"+"\n\n"+"Dear "+firstName+". Congratulations! You have been registered as a user on the Afripaw Smart App.";
      //loop through all the users
      allUsers?.data?.map(async (user) => {
        const mobile = user?.mobile ?? "";
        const destinationNumber = mobile;
        try {
          await sendSMS(message, destinationNumber);
          console.log("SMS sent successfully");
          setUserSuccess("Yes");
        } catch (error) {
          console.error("Failed to send SMS", error);
          setUserSuccess("No");
        }
      });

      //loop through all the pet owners
      allPetOwners?.data?.map(async (petOwner) => {
        const mobile = petOwner?.mobile ?? "";
        const destinationNumber = mobile;
        try {
          await sendSMS(message, destinationNumber);
          console.log("SMS sent successfully");
          setPetOwnerSuccess("Yes");
        } catch (error) {
          console.error("Failed to send SMS", error);
          setPetOwnerSuccess("No");
        }
      });

      //loop through all the volunteers
      allVolunteers?.data?.map(async (volunteer) => {
        const mobile = volunteer?.mobile ?? "";
        const destinationNumber = mobile;
        try {
          await sendSMS(message, destinationNumber);
          console.log("SMS sent successfully");
          setVolunteerSuccess("Yes");
        } catch (error) {
          console.error("Failed to send SMS", error);
          setVolunteerSuccess("No");
        }
      });
    }

    if (userSuccess === "Yes" && petOwnerSuccess === "Yes" && volunteerSuccess === "Yes") {
      setSuccess("Yes");
    } else {
      setSuccess("No");
    }

    const recipients = [""];
    if (includeUser) {
      recipients.push("User");
    }
    if (includePetOwner) {
      recipients.push("Pet Owner");
    }
    if (includeVolunteer) {
      recipients.push("Volunteer");
    }

    await newCommunication.mutateAsync({
      message: message,
      recipients: recipients,
      greaterArea: greaterAreaList,
      area: areaList,
      type: preferredOption,
      success: success,
    });

    setIsCreate(false);

    // return newUser_;
  };

  //-------------------------------VIEW PROFILE PAGE-----------------------------------------
  const [isViewProfilePage, setIsViewProfilePage] = useState(false);
  const handleViewProfilePage = async (id: number) => {
    setIsViewProfilePage(true);
    setID(id);

    const communication = user_data?.find((communication) => communication.communicationID === id);
    console.log("Communication view profile button has this value for communication: ", communication);
    // console.log("View profile page: ", JSON.stringify(clinic.data));
    if (communication) {
      // Assuming userQuery.data contains the user object
      const userData = communication;
      setMessage(userData.message ?? "");
      setPreferredCommunicationOption(userData.type ?? "");
      //setType(userData.type ?? "");
      setSuccess(userData.success ?? "No");
    }
    setIsCreate(false);
    setIsViewProfilePage(true);
  };

  useEffect(() => {
    //console.log("View profile page: ", JSON.stringify(user.data));
    if (isViewProfilePage) {
      //void clinic.refetch();
    }
    if (communication) {
      const userData = communication;
      setMessage(userData.message ?? "");
      setPreferredCommunicationOption(userData.type ?? "");
      setSuccess(userData.success ?? "No");
    }
  }, [isViewProfilePage]); // Effect runs when userQuery.data changes

  //-------------------------------BACK BUTTON-----------------------------------------
  const handleBackButton = () => {
    //console.log("Back button pressed");
    setIsCreate(false);
    setIsViewProfilePage(false);
    setID(0);
    setMessage("");
    setGreaterAreaOption("Select one");
    setAreaOption("Select one");
    setPreferredCommunicationOption("Select one");
    setSuccess("No");
  };

  //-----------------------------PREVENTATIVE ERROR MESSAGES---------------------------

  //-------------------------------MODAL-----------------------------------------
  //CREATE BUTTON MODAL
  const [isCreateButtonModalOpen, setIsCreateButtonModalOpen] = useState(false);
  const [mandatoryFields, setMandatoryFields] = useState<string[]>([]);
  const [errorFields, setErrorFields] = useState<{ field: string; message: string }[]>([]);

  const handleCreateButtonModal = () => {
    const mandatoryFields: string[] = [];
    const errorFields: { field: string; message: string }[] = [];

    if (message === "") mandatoryFields.push("Message");

    //select atleast one recipient
    if (!includeUser && !includePetOwner && !includeVolunteer) mandatoryFields.push("Select atleast one recipient");

    //select preferred communication
    if (preferredOption === "Select one") mandatoryFields.push("Select type of communication");

    //select atleast one field
    if (greaterAreaList.length === 0 && areaList.length === 0) mandatoryFields.push("Select atleast one field");

    setMandatoryFields(mandatoryFields);
    setErrorFields(errorFields);

    if (mandatoryFields.length > 0 || errorFields.length > 0) {
      setIsCreateButtonModalOpen(true);
    } else {
      void handleNewUser();
    }
  };

  //DELETE BUTTON MODAL
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteModalID, setDeleteModalID] = useState("");
  const [deleteModalName, setDeleteModalName] = useState("");
  const [deleteUserID, setDeleteUserID] = useState(0);
  const handleDeleteModal = (id: number, userID: string, name: string) => {
    setDeleteUserID(id);
    setDeleteModalID(userID);
    setDeleteModalName(name);
    setIsDeleteModalOpen(true);
  };

  //----------------------------------ORDER FIELDS----------------------------------
  const handleOrderFields = (field: string) => {
    setOrder(field);
  };

  return (
    <>
      <Head>
        <title>Communication Profiles</title>
      </Head>
      <main className="flex flex-col">
        <Navbar />
        {!isCreate && !isViewProfilePage && (
          <>
            <div className="flex flex-col text-black">
              <DeleteButtonModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                userID={deleteModalID}
                userName={deleteModalName}
                onDelete={() => handleDeleteRow(deleteUserID)}
              />
              <div className="sticky top-20 z-20 bg-white py-4">
                <div className="relative flex justify-center">
                  <input
                    className="mt-3 flex w-1/3 rounded-lg border-2 border-zinc-800 px-2"
                    placeholder="Search..."
                    onChange={(e) => setQuery(getQueryFromSearchPhrase(e.target.value))}
                  />
                  <button
                    className="absolute right-0 top-0 mx-3 mb-3 rounded-lg bg-main-orange p-3 text-white hover:bg-orange-500"
                    onClick={handleCreateNewUser}
                  >
                    Create New Message
                  </button>
                  {/* <button className="absolute left-0 top-0 mx-3 mb-3 rounded-lg bg-main-orange p-3 hover:bg-orange-500" onClick={handleDeleteAllUsers}>
                    Delete all users
                  </button> */}
                </div>
              </div>
              <article className="my-6 flex max-h-[60%] w-full items-center justify-center overflow-auto rounded-md shadow-inner">
                <table className="table-auto">
                  <thead>
                    <tr>
                      <th className="px-4 py-2"></th>
                      <th className=" px-4 py-2">ID</th>
                      <th className="px-4 py-2">Message</th>
                      <th className="px-4 py-2">Type</th>
                      <th className="px-4 py-2">Recipients</th>
                      <th className="px-4 py-2">Greater Area</th>
                      <th className="px-4 py-2">Area</th>
                      <th className="px-4 py-2">Success</th>
                      <th className="w-[35px] px-4 py-2">
                        <span className="group relative inline-block">
                          <button className={`${order === "updatedAt" ? "underline" : ""}`} onClick={() => handleOrderFields("updatedAt")}>
                            Date
                          </button>
                          <span className="absolute right-[-20px] top-full hidden w-[110px] rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 shadow-sm group-hover:block">
                            Sort reverse chronologically
                          </span>
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {user_data?.map((user, index) => {
                      return (
                        <tr className="items-center">
                          <td className=" border px-4 py-2">
                            <div className="px-4 py-2">{index + 1}</div>
                          </td>
                          <td className="border px-4 py-2">C{user.communicationID}</td>
                          <td className="border px-4 py-2">{user.message}</td>
                          <td className="border px-4 py-2">{user.type}</td>
                          <td className="border px-4 py-2">
                            {
                              //Show the list of all the recipients
                              user.recipients
                              //user.recipients?.map((user: string) => user).join(", ") ?? ""
                            }
                          </td>
                          <td className="border px-4 py-2">{user.greaterArea}</td>
                          <td className="border px-4 py-2">{user.area}</td>
                          <td className="border px-4 py-2">{user.success}</td>
                          <td className=" border px-4 py-2">
                            {user?.updatedAt?.getDate()?.toString() ?? ""}
                            {"/"}
                            {((user?.updatedAt?.getMonth() ?? 0) + 1)?.toString() ?? ""}
                            {"/"}
                            {user?.updatedAt?.getFullYear()?.toString() ?? ""}
                          </td>

                          <div className="flex">
                            <div className="relative flex items-center justify-center">
                              <span className="group relative mx-2 my-3 flex items-center justify-center rounded-lg hover:bg-orange-200">
                                <Trash
                                  size={24}
                                  className="block"
                                  onClick={() =>
                                    handleDeleteModal(
                                      user.communicationID ?? 0,
                                      String(user.communicationID),
                                      //get the first 15 charactters of the message
                                      user.message?.length ?? 0 > 15 ? user.message?.substring(0, 15) + "..." : user.message ?? "",
                                    )
                                  }
                                />
                                <span className="absolute bottom-full hidden rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 shadow-sm group-hover:block">
                                  Delete communication
                                </span>
                              </span>
                            </div>

                            {/* <div className="relative flex items-center justify-center">
                              <span className="group relative mx-2 my-3 flex items-center justify-center rounded-lg hover:bg-orange-200">
                                <Pencil size={24} className="block" onClick={() => handleUpdateUserProfile(user.clinicID ?? 0)} />
                                <span className="absolute bottom-full hidden rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 shadow-sm group-hover:block">
                                  Update clinic
                                </span>
                              </span>
                            </div> */}

                            <div className="relative flex items-center justify-center">
                              <span className="group relative mx-2 my-3 flex items-center justify-center rounded-lg hover:bg-orange-200">
                                <AddressBook size={24} className="block" onClick={() => handleViewProfilePage(user.communicationID ?? 0)} />
                                <span className="absolute bottom-full hidden w-[82px] rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 shadow-sm group-hover:block">
                                  View communication profile
                                </span>
                              </span>
                            </div>
                          </div>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </article>
              <div ref={observerTarget} />
            </div>
          </>
        )}
        {isCreate && (
          <>
            <div className="flex justify-center">
              <div className="relative mb-4 flex grow flex-col items-center rounded-lg bg-slate-200 px-5 py-6">
                <b className=" text-2xl">{"Send Message"}</b>
                <div className="flex justify-center">
                  <button className="absolute right-0 top-0 m-3 rounded-lg bg-main-orange p-3 text-white hover:bg-orange-500" onClick={handleBackButton}>
                    Back
                  </button>
                </div>
                <CreateButtonModal
                  isOpen={isCreateButtonModalOpen}
                  mandatoryFields={mandatoryFields}
                  errorFields={errorFields}
                  onClose={() => setIsCreateButtonModalOpen(false)}
                />
              </div>
            </div>
            <div className="flex grow flex-col items-center">
              <div className="flex w-[46%] flex-col">
                {/*<div className="p-2">User ID: {(lastUserCreated?.data?.userID ?? 1000000) + 1}</div>*/}
                <div className="relative my-2 flex w-full flex-col rounded-lg border-2 bg-slate-200 p-4">
                  <b className="mb-3 text-center text-xl">Communication Data</b>

                  <div className="flex items-start">
                    <div className="w-32 pt-3">Message: </div>
                    <textarea
                      className="m-2 h-24 w-full rounded-lg border-2 border-slate-300 px-2 focus:border-black"
                      placeholder="Type here..."
                      onChange={(e) => setMessage(e.target.value)}
                      value={message}
                    />
                  </div>

                  {/*Make checkboxes to select a user */}
                  <div className="flex flex-col items-center">
                    <span>Select recipient</span>
                    <div className="flex items-center justify-around">
                      <div className="flex flex-col">
                        <div className="flex items-center p-3">
                          <input
                            id="checked-checkbox"
                            type="checkbox"
                            onChange={(e) => setIncludeUser(e.target.checked)}
                            className="h-4 w-4 rounded bg-gray-100 text-main-orange accent-main-orange focus:ring-2"
                          />
                          <label htmlFor="checked-checkbox" className="ms-2 text-sm font-medium text-gray-900">
                            User
                          </label>
                        </div>
                      </div>

                      <div className="flex flex-col">
                        <div className="flex items-center p-3">
                          <input
                            id="checked-checkbox"
                            type="checkbox"
                            onChange={(e) => setIncludePetOwner(e.target.checked)}
                            className="h-4 w-4 rounded bg-gray-100 text-main-orange accent-main-orange focus:ring-2"
                          />
                          <label htmlFor="checked-checkbox" className="ms-2 text-sm font-medium text-gray-900">
                            Pet Owner
                          </label>
                        </div>
                      </div>

                      <div className="flex items-center p-3">
                        <input
                          id="checked-checkbox"
                          type="checkbox"
                          onChange={(e) => setIncludeVolunteer(e.target.checked)}
                          className="h-4 w-4 rounded bg-gray-100 text-main-orange accent-main-orange focus:ring-2"
                        />
                        <label htmlFor="checked-checkbox" className="ms-2 text-sm font-medium text-gray-900">
                          Volunteer
                        </label>
                      </div>
                    </div>
                  </div>

                  {(includeUser || includePetOwner || includeVolunteer) && (
                    <>
                      {/* Greater Area */}
                      <div className="flex items-start">
                        <div className="mr-3 flex items-center pt-4">
                          <div className="flex">Greater Area: </div>
                        </div>

                        <div className="flex flex-col items-center">
                          <button
                            onClick={handleShowGreaterArea}
                            className="mb-2 mr-3 mt-3 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                          >
                            Show all greater areas attended
                          </button>
                          {showGreaterArea && (
                            <ul className="mr-3 w-full rounded-lg bg-white px-5 py-2 text-sm text-gray-700 dark:text-gray-200">
                              {greaterAreaList.map((greaterArea) => (
                                <li key={greaterArea} className=" py-2">
                                  {greaterArea}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>

                        <div className="flex flex-col">
                          <button
                            ref={btnGreaterAreaRef}
                            className="my-3 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                            type="button"
                            onClick={handleToggleGreaterArea}
                          >
                            {greaterAreaOption + " "}
                            <svg className="ms-3 h-2.5 w-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                            </svg>
                          </button>
                          {isGreaterAreaOpen && (
                            <div ref={greaterAreaRef} className="z-10 w-44 divide-y divide-gray-100 rounded-lg bg-white shadow dark:bg-gray-700">
                              <ul className="py-2 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdownHoverButton">
                                {greaterAreaOptions.map((option) => (
                                  <li key={option} onClick={() => handleGreaterAreaOption(option)}>
                                    <button className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">{option}</button>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Area */}
                      <div className="flex items-start">
                        <div className="mr-3 flex items-center pt-4">
                          <div className="flex">Area: </div>
                        </div>

                        <div className="flex flex-col items-center">
                          <button
                            onClick={handleShowArea}
                            className="mb-2 mr-3 mt-3 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                          >
                            Show all areas attended
                          </button>
                          {showArea && (
                            <ul className="mr-3 w-full rounded-lg bg-white px-5 py-2 text-sm text-gray-700 dark:text-gray-200">
                              {areaList.map((area) => (
                                <li key={area} className=" py-2">
                                  {area}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>

                        <div className="flex flex-col">
                          <button
                            ref={btnAreaRef}
                            className="my-3 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                            type="button"
                            onClick={handleToggleArea}
                          >
                            {areaOption + " "}
                            <svg className="ms-3 h-2.5 w-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                            </svg>
                          </button>
                          {isAreaOpen && (
                            <div ref={areaRef} className="z-10 w-44 divide-y divide-gray-100 rounded-lg bg-white shadow dark:bg-gray-700">
                              <ul className="py-2 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdownHoverButton">
                                {areaOptions.map((option) => (
                                  <li key={option} onClick={() => handleAreaOption(option)}>
                                    <button className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">{option}</button>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {/*PREFERRED  COMMUNICATION*/}
                  <div className="flex items-start">
                    <div className="mr-3 flex items-center pt-5">
                      <div className=" flex">
                        Type of Communication<div className="text-lg text-main-orange">*</div>:{" "}
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <button
                        ref={btnPreferredCommunicationRef}
                        className="my-3 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                        type="button"
                        onClick={handleTogglePreferredCommunication}
                      >
                        {preferredOption + " "}
                        <svg className="ms-3 h-2.5 w-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                        </svg>
                      </button>
                      {preferredCommunication && (
                        <div ref={preferredCommunicationRef} className="z-10 w-44 divide-y divide-gray-100 rounded-lg bg-white shadow dark:bg-gray-700">
                          <ul className="py-2 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdownHoverButton">
                            {preferredCommunicationOptions.map((option) => (
                              <li key={option} onClick={() => handlePreferredCommunicationOption(option)}>
                                <button className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">{option}</button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <button
                className="my-4 rounded-md bg-main-orange px-8 py-3 text-lg text-white hover:bg-orange-500"
                onClick={() => void handleCreateButtonModal()}
              >
                {"Send Message"}
              </button>
            </div>
          </>
        )}

        {isViewProfilePage && (
          <>
            <div className="flex justify-center">
              <div className="relative mb-4 flex grow flex-col items-center rounded-lg bg-slate-200 px-5 py-6">
                <div className=" text-2xl">Communication Profile</div>
                <div className="flex justify-center">
                  <button className="absolute right-0 top-0 m-3 rounded-lg bg-main-orange p-3 text-white hover:bg-orange-500" onClick={handleBackButton}>
                    Back
                  </button>
                </div>
              </div>
            </div>
            <div ref={printComponentRef} className="flex grow flex-col items-center">
              <div className="mt-6 flex w-[40%] max-w-xl flex-col items-start">
                <div className="relative my-2 flex w-full flex-col rounded-lg border-2 bg-slate-200 p-4">
                  <div className="absolute left-0 top-0">
                    <Image
                      src={"/afripaw-logo.jpg"}
                      alt="Afripaw Logo"
                      className="m-3  aspect-square h-max rounded-full border-2 border-gray-200"
                      width={80}
                      height={80}
                    />
                  </div>

                  <b className="mb-14 text-center text-xl">Communication Data</b>
                  <div className="mb-2 flex items-center">
                    <b className="mr-3">Communication ID:</b> C{id}
                  </div>

                  <div className="mb-2 flex items-center">
                    <b className="mr-3">Message:</b>{" "}
                    {
                      //Just get the first 15 characters of the message
                      message?.length > 15 ? message?.substring(0, 15) + "..." : message
                    }
                  </div>

                  <div className="mb-2 flex items-center">
                    <b className="mr-3">Type:</b> {preferredOption}
                  </div>

                  <div className="mb-2 flex items-center">
                    <b className="mr-3">Recipients:</b> {}
                  </div>

                  <div className="mb-2 flex items-center">
                    <b className="mr-3">Greater Area:</b> {greaterAreaList.map((greaterArea) => greaterArea).join(", ")}
                  </div>

                  <div className="mb-2 flex items-center">
                    <b className="mr-3">Area:</b> {areaList.map((area) => area).join(", ")}
                  </div>

                  <div className="mb-2 flex items-center">
                    <b className="mr-3">Success:</b> {success}
                  </div>

                  <div className="mb-2 flex items-center">
                    <b className="mr-3">Date:</b>{" "}
                    {updatedAt?.getDate()?.toString() + "/" + ((updatedAt?.getMonth() ?? 0) + 1)?.toString() + "/" + updatedAt?.getFullYear()?.toString()}
                  </div>
                </div>
              </div>
            </div>
            <div className="my-6 flex justify-center">
              {/* <button
                className="mr-4 flex w-24 items-center justify-center rounded-lg bg-main-orange p-3 text-white"
                onClick={() => void handleUpdateFromViewProfilePage()}
              >
                Update profile
              </button> */}
              <ReactToPrint
                trigger={() => (
                  <button className="flex w-24 items-center justify-center rounded-lg bg-main-orange p-3 text-white">
                    <Printer size={24} className="mr-1" />
                    Print
                  </button>
                )}
                content={() => printComponentRef.current}
              />
            </div>
          </>
        )}
      </main>
    </>
  );
};

export default Communication;
