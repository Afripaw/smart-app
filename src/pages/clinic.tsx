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
import { UploadButton } from "~/utils/uploadthing";
import { useSession } from "next-auth/react";
import Input from "~/components/Base/Input";
import { bg } from "date-fns/locale";
import { set } from "date-fns";
import { router } from "@trpc/server";

const Clinic: NextPage = () => {
  useSession({ required: true });

  const newClinic = api.petClinic.create.useMutation();
  const updateClinic = api.petClinic.update.useMutation();
  const [isUpdate, setIsUpdate] = useState(false);
  const [isCreate, setIsCreate] = useState(false);
  //Update the table when user is deleted
  const [isDeleted, setIsDeleted] = useState(false);

  //For moving between different pages
  const router = useRouter();

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
  const deleteRow = api.petClinic.deleteClinic.useMutation();
  const handleDeleteRow = async (id: number) => {
    setIsDeleteModalOpen(false);
    await deleteRow.mutateAsync({ clinicID: id });
    isDeleted ? setIsDeleted(false) : setIsDeleted(true);
  };

  //autoload the table
  /* useEffect(() => {
    void data.refetch();
  }, [isUpdate, isDeleted, isCreate]);*/

  //-------------------------------ID-----------------------------------------
  const [id, setID] = useState(0);

  //-------------------------------ORDER-----------------------------------------
  //Order fields
  //sorts the table according to specific fields
  const [order, setOrder] = useState("date");

  //-------------------------------INFINITE SCROLLING WITH INTERSECTION OBSERVER-----------------------------------------
  const observerTarget = useRef<HTMLDivElement | null>(null);

  const [limit] = useState(12);
  const {
    data: queryData,
    fetchNextPage,
    hasNextPage,
    refetch,
  } = api.petClinic.searchClinicsInfinite.useInfiniteQuery(
    {
      clinicID: id,
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
  }, [isUpdate, isDeleted, isCreate, query, order]);

  const clinic = user_data?.find((clinic) => clinic.clinicID === id);

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
  const [comments, setComments] = useState("");
  const [startingDate, setStartingDate] = useState(new Date());
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

  const [conditions, setConditions] = useState(false);
  const [conditionOption, setConditionOption] = useState("Select one");
  const conditionRef = useRef<HTMLDivElement>(null);
  const btnConditionRef = useRef<HTMLButtonElement>(null);

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

  //AREA
  const handleToggleArea = () => {
    setIsAreaOpen(!isAreaOpen);
  };

  //SetStateAction<string>
  const handleAreaOption = (option: string) => {
    setAreaOption(option);
    setIsAreaOpen(false);
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

  //CONDITIONS
  const handleToggleConditions = () => {
    setConditions(!conditions);
  };

  const handleConditionOption = (option: SetStateAction<string>) => {
    setConditionOption(option);
    setConditions(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        conditionRef.current &&
        !conditionRef.current.contains(event.target as Node) &&
        btnConditionRef.current &&
        !btnConditionRef.current.contains(event.target as Node)
      ) {
        setConditions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const conditionOptions = [
    "Fair",
    "Light wind",
    "Strong wind",
    "Light rain",
    "Heavy rain",
    "Excessively hot",
    "Excessively cold",
    "Free food parcels",
    "Incentive competition",
    "External restrictions",
  ];

  // const [sendUserDetails, setSendUserDetails] = useState(false);

  //-------------------------------UPDATE USER-----------------------------------------
  //Update the user's details in fields
  const handleUpdateUserProfile = async (id: number) => {
    setID(id);

    const clinic = user_data?.find((clinic) => clinic.clinicID === id);
    if (clinic) {
      // Assuming userQuery.data contains the user object
      const userData = clinic;
      setGreaterAreaOption(userData?.greaterArea ?? "Select one");
      setAreaOption(userData.area ?? "Select one");
      setStartingDate(userData?.date ?? new Date());
      setComments(userData.comments ?? "");
      setConditionOption(userData.conditions ?? "Select one");

      //Make sure thet area and street options have a value
      if (userData.area === "") {
        setAreaOption("Select one");
      }
    }

    //isUpdate ? setIsUpdate(true) : setIsUpdate(true);
    //isCreate ? setIsCreate(false) : setIsCreate(false);
    setIsUpdate(true);
    setIsCreate(false);
  };

  useEffect(() => {
    if (clinic) {
      // Assuming userQuery.data contains the user object
      const userData = clinic;
      setGreaterAreaOption(userData.greaterArea ?? "Select one");
      setAreaOption(userData.area ?? "");
      setStartingDate(userData.date ?? new Date());
      setComments(userData.comments ?? "");
      setConditionOption(userData.conditions ?? "Select one");

      if (userData.area === "") {
        console.log("Area option is select one");
        setAreaOption("Select one");
      }
    }
  }, [isUpdate, isCreate]); // Effect runs when userQuery.data changes

  const handleUpdateUser = async () => {
    await updateClinic.mutateAsync({
      clinicID: id,
      greaterArea: greaterAreaOption === "Select one" ? "" : greaterAreaOption,
      area: areaOption === "Select one" ? "" : areaOption,
      date: startingDate,
      conditions: conditionOption === "Select one" ? "" : conditionOption,
      comments: comments,
    });
    //After the newUser has been created make sure to set the fields back to empty
    setGreaterAreaOption("Select one");
    setAreaOption("Select one");
    setConditionOption("Select one");
    setComments("");
    setIsUpdate(false);
    setIsCreate(false);
  };

  //-------------------------------CREATE NEW USER-----------------------------------------

  const handleCreateNewUser = async () => {
    setGreaterAreaOption("Select one");
    setAreaOption("Select one");
    setStartingDate(new Date());
    setComments("");
    setConditionOption("Select one");
    //isCreate ? setIsCreate(false) : setIsCreate(true);
    setIsCreate(true);
    setIsUpdate(false);
  };
  //-------------------------------NEW USER-----------------------------------------

  const handleNewUser = async () => {
    await newClinic.mutateAsync({
      greaterArea: greaterAreaOption === "Select one" ? "" : greaterAreaOption,
      area: areaOption === "Select one" ? "" : areaOption,
      date: startingDate,
      comments: comments,
      conditions: conditionOption === "Select one" ? "" : conditionOption,
    });

    setIsCreate(false);
    setIsUpdate(false);

    // return newUser_;
  };

  //-------------------------------VIEW PROFILE PAGE-----------------------------------------
  const [isViewProfilePage, setIsViewProfilePage] = useState(false);
  const handleViewProfilePage = async (id: number) => {
    setIsViewProfilePage(true);
    setID(id);

    const clinic = user_data?.find((clinic) => clinic.clinicID === id);
    // console.log("View profile page: ", JSON.stringify(clinic.data));
    if (clinic) {
      // Assuming userQuery.data contains the user object
      const userData = clinic;
      setGreaterAreaOption(userData.greaterArea ?? "");
      setAreaOption(userData.area ?? "");
      setStartingDate(userData.date ?? new Date());
      setComments(userData.comments ?? "");
      setConditionOption(userData.conditions ?? "Select one");

      //Make sure thet area and street options have a value
      if (userData.area === "Select one") {
        setAreaOption("");
        console.log("Area option is select one");
      }
    }

    setIsUpdate(false);
    setIsCreate(false);
    setIsViewProfilePage(true);
  };

  useEffect(() => {
    //console.log("View profile page: ", JSON.stringify(user.data));
    if (isViewProfilePage) {
      //void clinic.refetch();
    }
    if (clinic) {
      const userData = clinic;
      setGreaterAreaOption(userData.greaterArea ?? "");
      setAreaOption(userData.area ?? "");
      setStartingDate(userData.date ?? new Date());
      setComments(userData.comments ?? "");
      //console.log("Select one");
      //Make sure thet area and street options have a value
      if (userData.area === "Select one" && !isUpdate) {
        setAreaOption("");
      }
      if (userData.area === "" && isUpdate) {
        setAreaOption("Select one");
      }
    }
  }, [isViewProfilePage]); // Effect runs when userQuery.data changes

  //Go to update page from the view profile page
  const handleUpdateFromViewProfilePage = async () => {
    setIsUpdate(true);
    setIsViewProfilePage(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  //-------------------------------BACK BUTTON-----------------------------------------
  const handleBackButton = () => {
    //console.log("Back button pressed");
    setIsUpdate(false);
    setIsCreate(false);
    setIsViewProfilePage(false);
    setID(0);
    setGreaterAreaOption("Select one");
    setAreaOption("Select one");
    setComments("");
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

    if (greaterAreaOption === "Select one") mandatoryFields.push("Greater Area");
    if (startingDate === null) mandatoryFields.push("Date");
    if (areaOption === "Select one") mandatoryFields.push("Area");
    if (conditionOption === "Select one") mandatoryFields.push("Condition");

    setMandatoryFields(mandatoryFields);
    setErrorFields(errorFields);

    if (mandatoryFields.length > 0 || errorFields.length > 0) {
      setIsCreateButtonModalOpen(true);
    } else {
      if (isUpdate) {
        void handleUpdateUser();
      } else {
        void handleNewUser();
      }
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

  // //-------------------------------INFINITE SCROLLING WITH INTERSECTION OBSERVER-----------------------------------------
  // const observerTarget = useRef<HTMLDivElement | null>(null);

  // const [limit] = useState(12);
  // const {
  //   data: queryData,
  //   fetchNextPage,
  //   hasNextPage,
  //   refetch,
  // } = api.petClinic.searchClinicsInfinite.useInfiniteQuery(
  //   {
  //     clinicID: id,
  //     limit: limit,
  //     searchQuery: query,
  //     order: order,
  //   },
  //   {
  //     getNextPageParam: (lastPage) => {
  //       console.log("Next Cursor: " + lastPage.nextCursor);
  //       return lastPage.nextCursor;
  //     },
  //     enabled: false,
  //   },
  // );

  // //Flattens the pages array into one array
  // const user_data = queryData?.pages.flatMap((page) => page.user_data);

  // //Checks intersection of the observer target and reassigns target element once true
  // useEffect(() => {
  //   if (!observerTarget.current || !fetchNextPage) return;

  //   const observer = new IntersectionObserver(
  //     (entries) => {
  //       if (entries[0]?.isIntersecting && hasNextPage) void fetchNextPage();
  //     },
  //     { threshold: 1 },
  //   );

  //   if (observerTarget.current) observer.observe(observerTarget.current);

  //   const currentTarget = observerTarget.current;

  //   return () => {
  //     if (currentTarget) observer.unobserve(currentTarget);
  //   };
  // }, [fetchNextPage, hasNextPage, observerTarget]);

  // //Make it retrieve the data from tab;e again when the user is updated, deleted or created
  // useEffect(() => {
  //   void refetch();
  // }, [isUpdate, isDeleted, isCreate, query, order]);

  //-------------------------------------DATEPICKER--------------------------------------
  // Define the props for your custom input component
  interface CustomInputProps {
    value?: string;
    onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  }

  // CustomInput component with explicit types for the props
  const CustomInput: React.FC<CustomInputProps> = ({ value, onClick }) => (
    <button className="form-input flex items-center rounded-md border px-3 py-2" onClick={onClick}>
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
        <title>Clinic Profiles</title>
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
                onDelete={() => handleDeleteRow(deleteUserID)}
              />
              <div className="relative flex justify-center">
                <input
                  className="mt-3 flex w-1/3 rounded-lg border-2 border-zinc-800 px-2"
                  placeholder="Search..."
                  onChange={(e) => setQuery(getQueryFromSearchPhrase(e.target.value))}
                />
                <button className="absolute right-0 top-0 mx-3 mb-3 rounded-lg bg-main-orange p-3 text-white hover:bg-orange-500" onClick={handleCreateNewUser}>
                  Create new Clinic
                </button>
                {/*<button className="absolute left-0 top-0 mx-3 mb-3 rounded-lg bg-main-orange p-3 hover:bg-orange-500" onClick={handleDeleteAllUsers}>
                  Delete all users
        </button>*/}
              </div>
              <article className="my-6 flex max-h-[60%] w-full items-center justify-center overflow-auto rounded-md shadow-inner">
                <table className="table-auto">
                  <thead>
                    <tr>
                      <th className="px-4 py-2"></th>
                      <th className="px-4 py-2">
                        <button className={`${order == "date" ? "underline" : ""}`} onClick={() => handleOrderFields("date")}>
                          Date
                        </button>
                      </th>
                      <th className="px-4 py-2">Greater Area</th>
                      <th className="px-4 py-2">Area</th>
                      <th className="px-4 py-2">
                        Conditions
                        {/* <button className={`${order == "condition" ? "underline" : ""}`} onClick={() => handleOrderFields("condition")}>
                          Conditions
                        </button> */}
                      </th>
                      <th className="px-4 py-2">
                        <button className={`${order == "updatedAt" ? "underline" : ""}`} onClick={() => handleOrderFields("updatedAt")}>
                          Last update
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {user_data?.map((user, index) => {
                      return (
                        <tr className="items-center">
                          <div className="px-4 py-2">{index + 1}</div>
                          <td className="border px-4 py-2">
                            {user?.date?.getDate()?.toString() ?? ""}
                            {"/"}
                            {((user?.date?.getMonth() ?? 0) + 1)?.toString() ?? ""}
                            {"/"}
                            {user?.date?.getFullYear()?.toString() ?? ""}
                          </td>
                          <td className="border px-4 py-2">{user.greaterArea}</td>
                          <td className="border px-4 py-2">{user.area}</td>
                          <td className="border px-4 py-2">{user.conditions}</td>
                          <td className=" border px-4 py-2">
                            {user?.updatedAt?.getDate()?.toString() ?? ""}
                            {"/"}
                            {((user?.updatedAt?.getMonth() ?? 0) + 1)?.toString() ?? ""}
                            {"/"}
                            {user?.updatedAt?.getFullYear()?.toString() ?? ""}
                          </td>

                          <div className="flex">
                            <Trash
                              size={24}
                              className="mx-2 my-3 rounded-lg hover:bg-orange-200"
                              onClick={() =>
                                handleDeleteModal(
                                  user.clinicID ?? 0,
                                  String(user.clinicID),
                                  user.date?.getDate()?.toString() +
                                    "/" +
                                    ((user.date?.getMonth() ?? 0) + 1)?.toString() +
                                    "/" +
                                    user.date?.getFullYear()?.toString() ?? "",
                                )
                              }
                            />
                            <Pencil
                              size={24}
                              className="mx-2 my-3 rounded-lg hover:bg-orange-200"
                              onClick={() => handleUpdateUserProfile(user.clinicID ?? 0)}
                            />
                            <AddressBook
                              size={24}
                              className="mx-2 my-3 rounded-lg hover:bg-orange-200"
                              onClick={() => handleViewProfilePage(user.clinicID ?? 0)}
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
                <b className=" text-2xl">{isUpdate ? "Update Pet Clinic Data" : "Create New Pet Clinic"}</b>
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
              <div className="flex">
                {"("}All fields with <div className="px-1 text-lg text-main-orange"> * </div> are compulsary{")"}
              </div>
              <div className="flex w-[46%] flex-col">
                {/*<div className="p-2">User ID: {(lastUserCreated?.data?.userID ?? 1000000) + 1}</div>*/}
                <div className="relative my-2 flex w-full flex-col rounded-lg border-2 bg-slate-200 p-4">
                  <b className="mb-3 text-center text-xl">Pet Clinic Data</b>

                  {/*DATEPICKER*/}
                  <div className="flex items-center">
                    <div className=" flex">
                      Date<div className="text-lg text-main-orange">*</div>:{" "}
                    </div>

                    <DatePicker
                      selected={startingDate}
                      onChange={(date) => setStartingDate(date!)}
                      dateFormat="dd/MM/yyyy"
                      customInput={<CustomInput />}
                      className="form-input rounded-md border py-2"
                    />
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
                        className="my-3 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
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
                                <button className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">{option}</button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="mr-3 flex items-center pt-5">
                      <div className=" flex">Area: </div>
                    </div>
                    <div className="flex flex-col">
                      <button
                        ref={btnAreaRef}
                        className="my-3 inline-flex items-center rounded-lg bg-main-orange px-2 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
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

                  {/*CONDITIONS*/}
                  <div className="flex items-start">
                    <div className="mr-3 flex items-center pt-5">
                      <div className=" flex">
                        Conditions<div className="text-lg text-main-orange">*</div>:{" "}
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <button
                        ref={btnConditionRef}
                        className="my-3 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                        type="button"
                        onClick={handleToggleConditions}
                      >
                        {isUpdate ? conditionOption : conditionOption + " "}
                        <svg className="ms-3 h-2.5 w-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                        </svg>
                      </button>
                      {conditions && (
                        <div ref={conditionRef} className="z-10 w-44 divide-y divide-gray-100 rounded-lg bg-white shadow dark:bg-gray-700">
                          <ul className="py-2 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdownHoverButton">
                            {conditionOptions.map((option) => (
                              <li key={option} onClick={() => handleConditionOption(option)}>
                                <button className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">{option}</button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="w-32 pt-3">Comments: </div>
                    <textarea
                      className="m-2 h-24 w-full rounded-lg border-2 border-slate-300 px-2 focus:border-black"
                      placeholder="Type here: e.g. Notes on clinic success, attendance and noteworthy events"
                      onChange={(e) => setComments(e.target.value)}
                      value={comments}
                    />
                  </div>
                </div>
              </div>
              <button
                className="my-4 rounded-md bg-main-orange px-8 py-3 text-lg text-white hover:bg-orange-500"
                onClick={() => void handleCreateButtonModal()}
              >
                {isUpdate ? "Update" : "Create"}
              </button>
            </div>
          </>
        )}

        {isViewProfilePage && (
          <>
            <div className="flex justify-center">
              <div className="relative mb-4 flex grow flex-col items-center rounded-lg bg-slate-200 px-5 py-6">
                <div className=" text-2xl">Pet Clinic Profile</div>
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

                  <b className="mb-14 text-center text-xl">Pet Clinic Data</b>
                  <div className="mb-2 flex items-center">
                    <b className="mr-3">Clinic ID:</b> {clinic?.clinicID}
                  </div>

                  <div className="mb-2 flex items-center">
                    <b className="mr-3">Date:</b>{" "}
                    {clinic?.date?.getDate() + "/" + ((clinic?.date?.getMonth() ?? 0) + 1) + "/" + clinic?.date?.getFullYear() ?? ""}
                  </div>

                  <div className="mb-2 flex items-center">
                    <b className="mr-3">Greater Area:</b> {clinic?.greaterArea}
                  </div>

                  <div className="mb-2 flex items-center">
                    <b className="mr-3">Area:</b> {clinic?.area}
                  </div>

                  <div className="mb-2 flex items-center">
                    <b className="mr-3">Conditions:</b> {clinic?.conditions}
                  </div>

                  <div className="mb-2 flex items-center">
                    <b className="mr-3">Comments:</b> {clinic?.comments}
                  </div>
                </div>
              </div>
            </div>
            <div className="my-6 flex justify-center">
              <button
                className="mr-4 flex w-24 items-center justify-center rounded-lg bg-main-orange p-3 text-white"
                onClick={() => void handleUpdateFromViewProfilePage()}
              >
                Update profile
              </button>
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

export default Clinic;
