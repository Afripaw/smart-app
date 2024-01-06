import { type NextPage } from "next";
import Head from "next/head";
import React, { SetStateAction, useEffect, useRef, useState } from "react";
import { api } from "~/utils/api";
import ReactToPrint from "react-to-print";

//Components
import Navbar from "../components/navbar";
import CreateButtonModal from "../components/createButtonModal";
import DeleteButtonModal from "~/components/deleteButtonModal";

//Icons
import { AddressBook, Pencil, Printer, Trash } from "phosphor-react";

//Date picker
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const Volunteer: NextPage = () => {
  const newVolunteer = api.volunteer.create.useMutation();
  const updateVolunteer = api.volunteer.update.useMutation();
  const [isUpdate, setIsUpdate] = useState(false);
  const [isCreate, setIsCreate] = useState(false);
  //Update the table when user is deleted
  const [isDeleted, setIsDeleted] = useState(false);

  //-------------------------------SEARCH BAR------------------------------------
  //Query the users table
  const [query, setQuery] = useState("");

  //-------------------------------TABLE-----------------------------------------
  //const data = api.user.searchUsers.useQuery({ searchQuery: query });
  //delete specific row
  const deleteRow = api.volunteer.deleteVolunteer.useMutation();
  const handleDeleteRow = async (id: number) => {
    setIsDeleteModalOpen(false);
    await deleteRow.mutateAsync({ volunteerID: id });
    isDeleted ? setIsDeleted(false) : setIsDeleted(true);
  };

  //autoload the table
  /* useEffect(() => {
    void data.refetch();
  }, [isUpdate, isDeleted, isCreate]);*/

  //-------------------------------DELETE ALL USERS-----------------------------------------
  //Delete all users
  /*const deleteAllUsers = api.user.deleteAll.useMutation();
  const handleDeleteAllUsers = async () => {
    await deleteAllUsers.mutateAsync();
    isDeleted ? setIsDeleted(false) : setIsDeleted(true);
  };*/

  //---------------------------------PRINTING----------------------------------
  const printComponentRef = useRef(null);

  //---------------------------------EDIT BOXES----------------------------------
  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [street, setStreet] = useState("");
  const [addressStreetCode, setAddressStreetCode] = useState("");
  const [addressStreetNumber, setAddressStreetNumber] = useState("");
  const [addressSuburb, setAddressSuburb] = useState("");
  const [addressPostalCode, setAddressPostalCode] = useState("");
  const [comments, setComments] = useState("");
  const [startingDate, setStartingDate] = useState(new Date());

  //volunteerID
  //const [userID, setUserID] = useState("");
  const [id, setID] = useState("");

  //-------------------------------UPDATE VOLUNTEER-----------------------------------------
  const volunteer = api.volunteer.getVolunteerByID.useQuery({ volunteerID: Number(id) });

  //--------------------------------CREATE NEW USER DROPDOWN BOXES--------------------------------
  //WEBHOOKS FOR DROPDOWN BOXES
  const [isGreaterAreaOpen, setIsGreaterAreaOpen] = useState(false);
  const [greaterAreaOption, setGreaterAreaOption] = useState("Select one");
  const greaterAreaRef = useRef<HTMLDivElement>(null);
  const btnGreaterAreaRef = useRef<HTMLButtonElement>(null);

  const [preferredCommunication, setPreferredCommunication] = useState(false);
  const [preferredOption, setPreferredCommunicationOption] = useState("Select one");
  const preferredCommunicationRef = useRef<HTMLDivElement>(null);
  const btnPreferredCommunicationRef = useRef<HTMLButtonElement>(null);

  const [role, setRole] = useState(false);
  const [roleOption, setRoleOption] = useState("Select one");
  const roleRef = useRef<HTMLDivElement>(null);
  const btnRoleRef = useRef<HTMLButtonElement>(null);

  const [status, setStatus] = useState(false);
  const [statusOption, setStatusOption] = useState("Select one");
  const statusRef = useRef<HTMLDivElement>(null);
  const btnStatusRef = useRef<HTMLButtonElement>(null);

  //GREATER AREA
  const handleToggleGreaterArea = () => {
    setIsGreaterAreaOpen(!isGreaterAreaOpen);
  };

  const handleGreaterAreaOption = (option: SetStateAction<string>) => {
    setGreaterAreaOption(option);
    setIsGreaterAreaOpen(false);
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

  const preferredCommunicationOptions = ["Email", "SMS", "Whatsapp"];

  //ROLE
  const handleToggleRole = () => {
    setRole(!role);
  };

  const handleRoleOption = (option: SetStateAction<string>) => {
    setRoleOption(option);
    setRole(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (roleRef.current && !roleRef.current.contains(event.target as Node) && btnRoleRef.current && !btnRoleRef.current.contains(event.target as Node)) {
        setRole(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const roleOptions = ["System Administrator", "Data Analyst", "Data Consumer", "Treatment Data Capturer", "General Data Capturer"];

  //STATUS
  const handleToggleStatus = () => {
    setStatus(!status);
  };

  const handleStatusOption = (option: SetStateAction<string>) => {
    setStatusOption(option);
    setStatus(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        statusRef.current &&
        !statusRef.current.contains(event.target as Node) &&
        btnStatusRef.current &&
        !btnStatusRef.current.contains(event.target as Node)
      ) {
        setStatus(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const statusOptions = ["Active", "Passive"];

  //----------------------------COMMUNICATION OF USER DETAILS---------------------------
  //Send user's details to user
  //const [sendUserDetails, setSendUserDetails] = useState(false);

  //-------------------------------UPDATE USER-----------------------------------------
  //Update the user's details in fields
  const handleUpdateVolunteerProfile = async (id: string) => {
    setID(id);

    if (volunteer.data) {
      // Assuming userQuery.data contains the user object
      const userData = volunteer.data;
      setFirstName(userData.firstName ?? "");
      setSurname(userData.surname ?? "");
      setEmail(userData.email ?? "");
      setMobile(userData.mobile ?? "");
      setGreaterAreaOption(userData.addressGreaterArea ?? "Select one");
      setStreet(userData.addressStreet ?? "");
      setAddressStreetCode(userData.addressStreetCode ?? "");
      setAddressStreetNumber(userData.addressStreetNumber ?? "");
      setAddressSuburb(userData.addressSuburb ?? "");
      setAddressPostalCode(userData.addressPostalCode ?? "");
      setPreferredCommunicationOption(userData.preferredCommunication ?? "Select one");
      setStartingDate(userData.startingDate ?? new Date());
      setStatusOption(userData.status ?? "Select one");
      setComments(userData.comments ?? "");
    }

    isUpdate ? setIsUpdate(true) : setIsUpdate(true);
    isCreate ? setIsCreate(false) : setIsCreate(false);
  };

  useEffect(() => {
    if (volunteer.data) {
      // Assuming userQuery.data contains the user object
      const userData = volunteer.data;
      setFirstName(userData.firstName ?? "");
      setSurname(userData.surname ?? "");
      setEmail(userData.email ?? "");
      setMobile(userData.mobile ?? "");
      setGreaterAreaOption(userData.addressGreaterArea ?? "Select one");
      setStreet(userData.addressStreet ?? "");
      setAddressStreetCode(userData.addressStreetCode ?? "");
      setAddressStreetNumber(userData.addressStreetNumber ?? "");
      setAddressSuburb(userData.addressSuburb ?? "");
      setAddressPostalCode(userData.addressPostalCode ?? "");
      setPreferredCommunicationOption(userData.preferredCommunication ?? "Select one");
      setStartingDate(userData.startingDate ?? new Date());
      setStatusOption(userData.status ?? "Select one");
      setComments(userData.comments ?? "");
    }
  }, [volunteer.data, isUpdate, isCreate]); // Effect runs when userQuery.data changes

  const handleUpdateVolunteer = async () => {
    await updateVolunteer.mutateAsync({
      volunteerID: Number(id),
      firstName: firstName,
      email: email,
      surname: surname,
      mobile: mobile,
      addressGreaterArea: greaterAreaOption === "Select one" ? "" : greaterAreaOption,
      addressStreet: street,
      addressStreetCode: addressStreetCode,
      addressStreetNumber: addressStreetNumber,
      addressSuburb: addressSuburb,
      addressPostalCode: addressPostalCode,
      preferredCommunication: preferredOption === "Select one" ? "" : preferredOption,
      startingDate: startingDate,
      clinicAttended: [new Date()],
      status: statusOption === "Select one" ? "" : statusOption,
      comments: comments,
    });
    //After the newUser has been created make sure to set the fields back to empty
    setFirstName("");
    setEmail("");
    setSurname("");
    setMobile("");
    setGreaterAreaOption("Select one");
    setStreet("");
    setAddressStreetCode("");
    setAddressStreetNumber("");
    setAddressSuburb("");
    setAddressPostalCode("");
    setPreferredCommunicationOption("Select one");
    setRoleOption("Select one");
    setStatusOption("Select one");
    setComments("");
    isUpdate ? setIsUpdate(false) : setIsUpdate(false);
    isCreate ? setIsCreate(false) : setIsCreate(false);
  };

  //-------------------------------CREATE NEW USER-----------------------------------------

  const handleCreateNewUser = async () => {
    setGreaterAreaOption("Select one");
    setPreferredCommunicationOption("Select one");
    setRoleOption("Select one");
    setStatusOption("Select one");
    isCreate ? setIsCreate(false) : setIsCreate(true);
    setIsUpdate(false);
  };
  //-------------------------------NEW USER-----------------------------------------

  const handleNewVolunteer = async () => {
    await newVolunteer.mutateAsync({
      firstName: firstName,
      email: email,
      surname: surname,
      mobile: mobile,
      addressGreaterArea: greaterAreaOption === "Select one" ? "" : greaterAreaOption,
      addressStreet: street,
      addressStreetCode: addressStreetCode,
      addressStreetNumber: addressStreetNumber,
      addressSuburb: addressSuburb,
      addressPostalCode: addressPostalCode,
      preferredCommunication: preferredOption === "Select one" ? "" : preferredOption,
      startingDate: startingDate,
      clinicAttended: [new Date()],
      status: statusOption === "Select one" ? "" : statusOption,
      comments: comments,
    });
    //After the newUser has been created make sure to set the fields back to empty
    setFirstName("");
    setEmail("");
    setSurname("");
    setMobile("");
    setGreaterAreaOption("Select one");
    setStreet("");
    setAddressStreetCode("");
    setAddressStreetNumber("");
    setAddressSuburb("");
    setAddressPostalCode("");
    setPreferredCommunicationOption("Select one");
    setRoleOption("Select one");
    setStatusOption("Select one");
    setComments("");

    isCreate ? setIsCreate(false) : setIsCreate(false);
    isUpdate ? setIsUpdate(false) : setIsUpdate(false);
  };

  //-------------------------------VIEW PROFILE PAGE-----------------------------------------
  const [isViewProfilePage, setIsViewProfilePage] = useState(false);
  const handleViewProfilePage = async (id: string) => {
    setIsViewProfilePage(true);
    setID(id);

    console.log("View profile page: ", JSON.stringify(volunteer.data));
    if (volunteer.data) {
      // Assuming userQuery.data contains the user object
      const userData = volunteer.data;
      setFirstName(userData.firstName ?? "");
      setSurname(userData.surname ?? "");
      setEmail(userData.email ?? "");
      setMobile(userData.mobile ?? "");
      setGreaterAreaOption(userData.addressGreaterArea ?? "");
      setStreet(userData.addressStreet ?? "");
      setAddressStreetCode(userData.addressStreetCode ?? "");
      setAddressStreetNumber(userData.addressStreetNumber ?? "");
      setAddressSuburb(userData.addressSuburb ?? "");
      setAddressPostalCode(userData.addressPostalCode ?? "");
      setPreferredCommunicationOption(userData.preferredCommunication ?? "");
      setStartingDate(userData.startingDate ?? new Date());
      setStatusOption(userData.status ?? "");
      setComments(userData.comments ?? "");
    }

    setIsUpdate(false);
    setIsCreate(false);
    setIsViewProfilePage(true);
  };

  useEffect(() => {
    //console.log("View profile page: ", JSON.stringify(user.data));
    if (volunteer.data) {
      const userData = volunteer.data;

      setFirstName(userData.firstName ?? "");
      setSurname(userData.surname ?? "");
      setEmail(userData.email ?? "");
      setMobile(userData.mobile ?? "");
      setGreaterAreaOption(userData.addressGreaterArea ?? "");
      setStreet(userData.addressStreet ?? "");
      setAddressStreetCode(userData.addressStreetCode ?? "");
      setAddressStreetNumber(userData.addressStreetNumber ?? "");
      setAddressSuburb(userData.addressSuburb ?? "");
      setAddressPostalCode(userData.addressPostalCode ?? "");
      setPreferredCommunicationOption(userData.preferredCommunication ?? "");
      setStartingDate(userData.startingDate ?? new Date());
      setStatusOption(userData.status ?? "");
      setComments(userData.comments ?? "");
    }
  }, [isViewProfilePage, volunteer.data]); // Effect runs when userQuery.data changes

  //-------------------------------BACK BUTTON-----------------------------------------
  const handleBackButton = () => {
    //console.log("Back button pressed");
    setIsUpdate(false);
    setIsCreate(false);
    setIsViewProfilePage(false);
    setID("");
    setFirstName("");
    setEmail("");
    setSurname("");
    setMobile("");
    setGreaterAreaOption("Select one");
    setStreet("");
    setAddressStreetCode("");
    setAddressStreetNumber("");
    setAddressSuburb("");
    setAddressPostalCode("");
    setPreferredCommunicationOption("Select one");
    setRoleOption("Select one");
    setStatusOption("Select one");
    setComments("");
  };

  //-----------------------------PREVENTATIVE ERROR MESSAGES---------------------------
  //Mobile number
  const [mobileMessage, setMobileMessage] = useState("");
  useEffect(() => {
    console.log(mobile.length);
    if (mobile.match(/^[0-9]+$/) == null && mobile.length != 0) {
      setMobileMessage("Mobile number must only contain numbers");
    } else if (mobile.length != 10 && mobile.length != 0) {
      setMobileMessage("Mobile number must be 10 digits");
    } else if (!mobile.startsWith("0") && mobile.length != 0) {
      setMobileMessage("Mobile number must start with 0");
    } else {
      setMobileMessage("");
    }
  }, [mobile]);

  //Street code
  //const [streetCodeMessage, setStreetCodeMessage] = useState("");
  /*useEffect(() => {
    if (addressStreetCode.match(/^[0-9]+$/) == null && addressStreetCode.length != 0) {
      setStreetCodeMessage("Street code must only contain numbers");
    } else if (addressStreetCode.length > 4 && addressStreetCode.length != 0) {
      setStreetCodeMessage("Street code must be 4 digits or less");
    } else {
      setStreetCodeMessage("");
    }
  }, [addressStreetCode]);*/

  //Street number
  const [streetNumberMessage, setStreetNumberMessage] = useState("");
  useEffect(() => {
    if (addressStreetNumber.match(/^[0-9]+$/) == null && addressStreetNumber.length != 0) {
      setStreetNumberMessage("Street number must only contain numbers");
    } else if (addressStreetNumber.length > 4 && addressStreetNumber.length != 0) {
      setStreetNumberMessage("Street number must be 4 digits or less");
    } else {
      setStreetNumberMessage("");
    }
  }, [addressStreetNumber]);

  //Postal code
  const [postalCodeMessage, setPostalCodeMessage] = useState("");
  useEffect(() => {
    if (addressPostalCode.match(/^[0-9]+$/) == null && addressPostalCode.length != 0) {
      setPostalCodeMessage("Postal code must only contain numbers");
    } else if (addressPostalCode.length > 4 && addressPostalCode.length != 0) {
      setPostalCodeMessage("Postal code must be 4 digits or less");
    } else {
      setPostalCodeMessage("");
    }
  }, [addressPostalCode]);

  //-------------------------------MODAL-----------------------------------------
  //CREATE BUTTON MODAL
  const [isCreateButtonModalOpen, setIsCreateButtonModalOpen] = useState(false);
  const [mandatoryFields, setMandatoryFields] = useState<string[]>([]);
  const [errorFields, setErrorFields] = useState<{ field: string; message: string }[]>([]);

  const handleCreateButtonModal = () => {
    const mandatoryFields: string[] = [];
    const errorFields: { field: string; message: string }[] = [];

    if (firstName === "") mandatoryFields.push("First Name");
    if (surname === "") mandatoryFields.push("Surname");
    if (mobile === "") mandatoryFields.push("Mobile");
    if (greaterAreaOption === "Select one") mandatoryFields.push("Greater Area");
    if (preferredOption === "Select one") mandatoryFields.push("Preferred Communication");
    if (roleOption === "Select one") mandatoryFields.push("Role");
    if (statusOption === "Select one") mandatoryFields.push("Status");
    if (startingDate === null) mandatoryFields.push("Starting Date");

    if (mobileMessage !== "") errorFields.push({ field: "Mobile", message: mobileMessage });
    //if (streetCodeMessage !== "") errorFields.push({ field: "Street Code", message: streetCodeMessage });
    if (streetNumberMessage !== "") errorFields.push({ field: "Street Number", message: streetNumberMessage });
    if (postalCodeMessage !== "") errorFields.push({ field: "Postal Code", message: postalCodeMessage });

    setMandatoryFields(mandatoryFields);
    setErrorFields(errorFields);

    if (mandatoryFields.length > 0 || errorFields.length > 0) {
      setIsCreateButtonModalOpen(true);
    } else {
      if (isUpdate) {
        void handleUpdateVolunteer();
      } else {
        void handleNewVolunteer();
      }
    }
  };

  //DELETE BUTTON MODAL
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteModalID, setDeleteModalID] = useState("");
  const [deleteModalName, setDeleteModalName] = useState("");
  const [deleteVolunteerID, setDeleteVolunteerID] = useState(0);
  const handleDeleteModal = (id: number, userID: string, name: string) => {
    setDeleteVolunteerID(id);
    setDeleteModalID(userID);
    setDeleteModalName(name);
    setIsDeleteModalOpen(true);
  };

  //-------------------------------INFINITE SCROLLING WITH INTERSECTION OBSERVER-----------------------------------------
  const observerTarget = useRef<HTMLDivElement | null>(null);

  const [limit] = useState(12);
  const {
    data: queryData,
    fetchNextPage,
    hasNextPage,
    refetch,
  } = api.volunteer.searchVolunteersInfinite.useInfiniteQuery(
    {
      volunteerID: Number(id),
      limit: limit,
      searchQuery: query,
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
  const volunteer_data = queryData?.pages.flatMap((page) => page.volunteer_data);

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
  }, [isUpdate, isDeleted, isCreate, query]);

  //-------------------------------------DATEPICKER--------------------------------------
  // Define the props for your custom input component
  interface CustomInputProps {
    value?: string;
    onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  }

  // CustomInput component with explicit types for the props
  const CustomInput: React.FC<CustomInputProps> = ({ value, onClick }) => (
    <button className="form-input flex items-center rounded-md border px-4 py-2" onClick={onClick}>
      <svg
        className="z-10 mr-2 h-4 w-4 text-gray-500 dark:text-gray-400"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M20 4a2 2 0 0 0-2-2h-2V1a1 1 0 0 0-2 0v1h-3V1a1 1 0 0 0-2 0v1H6V1a1 1 0 0 0-2 0v1H2a2 2 0 0 0-2 2v2h20V4ZM0 18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8H0v10Zm5-8h10a1 1 0 0 1 0 2H5a1 1 0 0 1 0-2Z" />
      </svg>
      <div className="m-1 mr-2">(Select here): </div>
      {isUpdate ? startingDate?.toLocaleDateString() : value}
    </button>
  );

  return (
    <>
      <Head>
        <title>Volunteer Profiles</title>
      </Head>
      <main className="flex flex-col">
        <Navbar />
        {!isCreate && !isUpdate && !isViewProfilePage && (
          <>
            <div className="mb-2 mt-9 flex flex-col text-black">
              <DeleteButtonModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                userID={deleteModalID}
                userName={deleteModalName}
                onDelete={() => handleDeleteRow(deleteVolunteerID)}
              />
              <div className="relative flex justify-center">
                <input
                  className="mt-3 flex w-1/3 rounded-lg border-2 border-zinc-800 px-2"
                  placeholder="Search..."
                  onChange={(e) => setQuery(e.target.value)}
                />
                <button className="absolute right-0 top-0 mx-3 mb-3 rounded-lg bg-main-orange p-3 hover:bg-orange-500" onClick={handleCreateNewUser}>
                  Create new Volunteer
                </button>
                {/*<button className="absolute left-0 top-0 mx-3 mb-3 rounded-lg bg-main-orange p-3 hover:bg-orange-500" onClick={handleDeleteAllUsers}>
                  Delete all users
        </button>*/}
              </div>
              <article className="mt-6 flex max-h-[80rem] w-full items-center justify-center overflow-auto rounded-md shadow-inner">
                <table className="table-auto">
                  <thead>
                    <tr>
                      <th className="px-4 py-2">First Name</th>
                      <th className="px-4 py-2">Surname</th>
                      <th className="px-4 py-2">Email</th>
                      <th className="px-4 py-2">Mobile</th>
                      <th className="px-4 py-2">Greater Area</th>
                      <th className="px-4 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {volunteer_data?.map((volunteer) => {
                      return (
                        <tr className="items-center">
                          <td className="border px-4 py-2">{volunteer.firstName}</td>
                          <td className="border px-4 py-2">{volunteer.surname}</td>
                          <td className="border px-4 py-2">{volunteer.email}</td>
                          <td className="border px-4 py-2">{volunteer.mobile}</td>
                          <td className="border px-4 py-2">{volunteer.addressGreaterArea}</td>
                          <td className="border px-4 py-2">{volunteer.status}</td>
                          <div className="flex">
                            <Trash
                              size={24}
                              className="mx-2 my-3 rounded-lg hover:bg-orange-200"
                              onClick={() => handleDeleteModal(volunteer.volunteerID, String(volunteer.volunteerID), volunteer.firstName ?? "")}
                            />
                            <Pencil
                              size={24}
                              className="mx-2 my-3 rounded-lg hover:bg-orange-200"
                              onClick={() => handleUpdateVolunteerProfile(String(volunteer.volunteerID))}
                            />
                            <AddressBook
                              size={24}
                              className="mx-2 my-3 rounded-lg hover:bg-orange-200"
                              onClick={() => handleViewProfilePage(String(volunteer.volunteerID))}
                            />
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
        {(isCreate || isUpdate) && (
          <>
            <div className="flex justify-center">
              <div className="relative mb-4 flex grow flex-col items-center rounded-lg bg-slate-200 px-5 py-6">
                <div className=" text-2xl">{isUpdate ? "Update Volunteer Information" : "Create New Volunteer"}</div>
                <div className="flex justify-center">
                  <button className="absolute right-0 top-0 m-3 rounded-lg bg-main-orange p-3 hover:bg-orange-500" onClick={handleBackButton}>
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
              <div className="flex flex-col items-start">
                {/*<div className="p-2">User ID: {(lastUserCreated?.data?.userID ?? 1000000) + 1}</div>*/}
                <div className="flex grow items-center justify-center">
                  <div className="mb-2 flex text-lg">
                    {"("}All fields with <div className="px-1 text-lg text-main-orange"> * </div> are compulsary{")"}
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="flex">
                    First Name<div className="text-lg text-main-orange">*</div>:{" "}
                  </div>
                  <input
                    className="m-2 rounded-lg border-2 border-slate-300 px-2 focus:border-black"
                    placeholder="Type here: e.g. John"
                    onChange={(e) => setFirstName(e.target.value)}
                    value={firstName}
                  />
                </div>

                <div className="flex items-center">
                  <div className="flex">
                    Surname<div className="text-lg text-main-orange">*</div>:{" "}
                  </div>
                  <input
                    className="m-2 rounded-lg border-2 border-slate-300 px-2 focus:border-black"
                    placeholder="Type here: e.g. Doe"
                    onChange={(e) => setSurname(e.target.value)}
                    value={surname}
                  />
                </div>

                <div className="flex items-center">
                  <div>Email: </div>
                  <input
                    className="m-2 rounded-lg border-2 border-slate-300 px-2 focus:border-black"
                    placeholder="Type here: e.g. jd@gmail.com"
                    onChange={(e) => setEmail(e.target.value)}
                    value={email}
                  />
                </div>

                <div className="flex items-center">
                  <div className="flex">
                    Mobile<div className="text-lg text-main-orange">*</div>:{" "}
                  </div>
                  <input
                    className="m-2 rounded-lg border-2 border-slate-300 px-2 focus:border-black"
                    placeholder="Type here: e.g. 0821234567"
                    onChange={(e) => setMobile(e.target.value)}
                    value={mobile}
                  />
                </div>

                {mobileMessage && <div className="text-sm text-red-500">{mobileMessage}</div>}

                <div className="flex items-start">
                  <div className="mr-3 flex items-center pt-5">
                    <div className="mr-3 flex">
                      Preferred Communication Channel<div className="text-lg text-main-orange">*</div>:{" "}
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <button
                      ref={btnPreferredCommunicationRef}
                      className="my-3 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
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
                              <a href="#" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">
                                {option}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="mr-3 flex items-center pt-4">
                    <div className="flex">
                      Greater Area<div className="text-lg text-main-orange">*</div>:{" "}
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <button
                      ref={btnGreaterAreaRef}
                      className="my-3 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                      type="button"
                      onClick={handleToggleGreaterArea}
                    >
                      {isUpdate ? greaterAreaOption : greaterAreaOption + " "}
                      <svg className="ms-3 h-2.5 w-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                      </svg>
                    </button>
                    {isGreaterAreaOpen && (
                      <div ref={greaterAreaRef} className="z-10 w-44 divide-y divide-gray-100 rounded-lg bg-white shadow dark:bg-gray-700">
                        <ul className="py-2 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdownHoverButton">
                          {greaterAreaOptions.map((option) => (
                            <li key={option} onClick={() => handleGreaterAreaOption(option)}>
                              <a href="#" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">
                                {option}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/*Street input */}
                <div className="flex items-center">
                  <div>Street: </div>
                  <input
                    className="m-2 rounded-lg border-2 border-slate-300 px-2 focus:border-black"
                    placeholder="Type here: e.g. Main"
                    onChange={(e) => setStreet(e.target.value)}
                    value={street}
                  />
                </div>

                <div className="flex items-center">
                  <div className="mr-3">Street Code: </div>
                  <input
                    className="m-2 rounded-lg border-2 border-slate-300 px-2 focus:border-black "
                    placeholder="Type here: e.g. 1234"
                    onChange={(e) => setAddressStreetCode(e.target.value)}
                    value={addressStreetCode}
                  />
                </div>
                {/*{streetCodeMessage && <div className="text-sm text-red-500">{streetCodeMessage}</div>}*/}

                <div className="flex items-center">
                  <div className="mr-3">Street Number: </div>
                  <input
                    className="m-2 rounded-lg border-2 border-slate-300 px-2 focus:border-black"
                    placeholder="Type here: e.g. 1234"
                    onChange={(e) => setAddressStreetNumber(e.target.value)}
                    value={addressStreetNumber}
                  />
                </div>
                {streetNumberMessage && <div className="text-sm text-red-500">{streetNumberMessage}</div>}

                <div className="flex items-center">
                  <div>Suburb: </div>
                  <input
                    className="m-2 rounded-lg border-2 border-slate-300 px-2 focus:border-black"
                    placeholder="Type here: e.g. Plaza"
                    onChange={(e) => setAddressSuburb(e.target.value)}
                    value={addressSuburb}
                  />
                </div>

                <div className="flex items-center">
                  <div>Postal Code: </div>
                  <input
                    className="m-2 rounded-lg border-2 border-slate-300 px-2 focus:border-black"
                    placeholder="Type here: e.g. 7102"
                    onChange={(e) => setAddressPostalCode(e.target.value)}
                    value={addressPostalCode}
                  />
                </div>
                {postalCodeMessage && <div className="text-sm text-red-500">{postalCodeMessage}</div>}

                <div className="flex items-start">
                  <div className="mr-3 flex items-center pt-5">
                    <div className="mr-3 flex">
                      Status<div className="text-lg text-main-orange">*</div>:{" "}
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <button
                      ref={btnStatusRef}
                      className="my-3 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                      type="button"
                      onClick={handleToggleStatus}
                    >
                      {statusOption + " "}
                      <svg className="ms-3 h-2.5 w-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                      </svg>
                    </button>
                    {status && (
                      <div ref={statusRef} className="z-10 w-44 divide-y divide-gray-100 rounded-lg bg-white shadow dark:bg-gray-700">
                        <ul className="py-2 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdownHoverButton">
                          {statusOptions.map((option) => (
                            <li key={option} onClick={() => handleStatusOption(option)}>
                              <a href="#" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">
                                {option}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/*DATEPICKER*/}
                <div className="flex items-center">
                  <div className="mr-3 flex">
                    Starting Date<div className="text-lg text-main-orange">*</div>:{" "}
                  </div>
                  <div className="p-4">
                    <DatePicker
                      selected={startingDate}
                      onChange={(date) => setStartingDate(date!)}
                      dateFormat="dd/MM/yyyy"
                      customInput={<CustomInput />}
                      className="form-input rounded-md border px-4 py-2"
                    />
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="mr-3 pt-3">Comments: </div>
                  <textarea
                    className="m-2 h-24 w-60 rounded-lg border-2 border-slate-300 px-2 focus:border-black"
                    placeholder="Type here: e.g. Hard worker"
                    onChange={(e) => setComments(e.target.value)}
                    value={comments}
                  />
                </div>
              </div>

              <button className="my-4 rounded-md bg-main-orange px-8 py-3 text-lg hover:bg-orange-500" onClick={() => void handleCreateButtonModal()}>
                {isUpdate ? "Update" : "Create"}
              </button>
            </div>
          </>
        )}

        {isViewProfilePage && (
          <>
            <div className="flex justify-center">
              <div className="relative mb-4 flex grow flex-col items-center rounded-lg bg-slate-200 px-5 py-6">
                <div className=" text-2xl">Volunteer Profile</div>
                <div className="flex justify-center">
                  <button className="absolute right-0 top-0 m-3 rounded-lg bg-main-orange p-3 hover:bg-orange-500" onClick={handleBackButton}>
                    Back
                  </button>
                </div>
              </div>
            </div>
            <div ref={printComponentRef} className="flex grow flex-col items-center">
              <div className="mt-6 flex max-w-xs flex-col items-start">
                <div className="mb-2 flex items-center">
                  <b className="mr-3">User ID:</b> {volunteer?.data?.volunteerID}
                </div>

                <div className="mb-2 flex items-center">
                  <b className="mr-3">First name:</b> {firstName}
                </div>

                <div className="mb-2 flex items-center">
                  <b className="mr-3">Surname:</b> {surname}
                </div>

                <div className="mb-2 flex items-center">
                  <b className="mr-3">Email:</b> {email}
                </div>

                <div className="mb-2 flex items-center">
                  <b className="mr-3">Mobile:</b> {mobile}
                </div>

                <div className="mb-2 flex items-center">
                  <b className="mr-3">Greater Area:</b> {greaterAreaOption}
                </div>

                <div className="mb-2 flex items-center">
                  <b className="mr-3">Street:</b> {street}
                </div>

                <div className="mb-2 flex items-center">
                  <b className="mr-3">Street Code:</b> {addressStreetCode}
                </div>

                <div className="mb-2 flex items-center">
                  <b className="mr-3">Street Number:</b> {addressStreetNumber}
                </div>

                <div className="mb-2 flex items-center">
                  <b className="mr-3">Suburb:</b> {addressSuburb}
                </div>

                <div className="mb-2 flex items-center">
                  <b className="mr-3">Postal Code:</b> {addressPostalCode}
                </div>

                <div className="mb-2 flex items-center">
                  <b className="mr-3">Preferred Communication:</b> {preferredOption}
                </div>

                <div className="mb-2 flex items-center">
                  <b className="mr-3">Status:</b> {statusOption}
                </div>

                <div className="mb-2 flex items-center">
                  <b className="mr-3">Starting Date:</b> {startingDate?.toLocaleDateString()}
                </div>

                <div className="mb-2 flex items-start">
                  <b className="mr-3">Comments:</b>
                  {comments}
                </div>
              </div>
            </div>
            <div className="my-6 flex justify-center">
              <ReactToPrint
                trigger={() => (
                  <button className="flex w-24 items-center justify-center rounded-lg bg-main-orange p-3">
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

export default Volunteer;
