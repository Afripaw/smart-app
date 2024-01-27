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

const Treatment: NextPage = () => {
  useSession({ required: true });

  const newTreatment = api.petTreatment.create.useMutation();
  const updateTreatment = api.petTreatment.update.useMutation();
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
  const deleteRow = api.petTreatment.deleteTreatment.useMutation();
  const handleDeleteRow = async (id: number) => {
    setIsDeleteModalOpen(false);
    await deleteRow.mutateAsync({ treatmentID: id });
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
  const [comments, setComments] = useState("");
  const [startingDate, setStartingDate] = useState(new Date());
  const [petID, setPetID] = useState(0);
  //const [image, setImage] = useState("");

  //userID
  //const [userID, setUserID] = useState("");
  const [id, setID] = useState(0);

  //---------------------------------NAVIGATION OF OWNER TO PET----------------------------------
  useEffect(() => {
    if (router.asPath.includes("petID")) {
      setPetID(Number(router.asPath.split("=")[1]));
      /*const query = router.asPath.split("?")[1] ?? "";

    console.log("Owner ID: ", query?.split("&")[0]?.split("=")[1] ?? "");
    console.log("Owner first name: ", query?.split("&")[1]?.split("=")[1] ?? "");
    console.log("Owner surname: ", query?.split("&")[2]?.split("=")[1] ?? "");
    console.log("Owner street number: ", query?.split("&")[3]?.split("=")[1] ?? "");
    console.log("Owner street: ", query?.split("&")[4]?.split("=")[1] ?? "");
    console.log("Owner area: ", query?.split("&")[5]?.split("=")[1] ?? "");
    console.log("Owner greater area: ", query?.split("&")[6]?.split("=")[1] ?? "");

    setOwnerID(Number(query?.split("&")[0]?.split("=")[1]));*/
      // setFirstName(query?.split("&")[1]?.split("=")[1]);
      // setSurname(query?.split("&")[2]?.split("=")[1]);
      // setStreetNumber(query?.split("&")[3]?.split("=")[1]);
      // setStreet(query?.split("&")[4]?.split("=")[1]);
      // setArea(query?.split("&")[5]?.split("=")[1]);
      // setGreaterArea(query?.split("&")[6]?.split("=")[1]);
      //console.log("Query: ", router.query);
      //console.log("Route: ", router.route);
      //console.log("as path: ", router.asPath);
      //console.log("base path: ", router.basePath);
      // console.log("Owner ID: ", ownerID);
      setIsCreate(true);
    }
  }, [router.asPath]);

  //-------------------------------NAVIGATING BY CLICKING ON THE TAB---------------------
  useEffect(() => {
    if (!isCreate) {
      setPetID(Number(treatment.data?.petID ?? 0));
    }
  }, [router.asPath]);

  const pet = api.pet.getPetByID.useQuery({ petID: petID });

  useEffect(() => {
    void pet.refetch();
  }, []);

  //-------------------------------UPDATE USER-----------------------------------------
  const treatment = api.petTreatment.getTreatmentByID.useQuery({ treatmentID: id });

  //Order fields
  //sorts the table according to specific fields
  const [order, setOrder] = useState("date");

  //--------------------------------CREATE NEW USER DROPDOWN BOXES--------------------------------
  //WEBHOOKS FOR DROPDOWN BOXES
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [categoryOption, setCategoryOption] = useState("Select one");
  const categoryRef = useRef<HTMLDivElement>(null);
  const btnCategoryRef = useRef<HTMLButtonElement>(null);

  const [isTypeOpen, setIsTypeOpen] = useState(false);
  const [typeOption, setTypeOption] = useState("Select one");
  const typeRef = useRef<HTMLDivElement>(null);
  const btnTypeRef = useRef<HTMLButtonElement>(null);

  //CATEGORY
  const handleToggleCategory = () => {
    setIsCategoryOpen(!isCategoryOpen);
  };

  const handleCategoryOption = (option: SetStateAction<string>) => {
    setCategoryOption(option);
    setIsCategoryOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        categoryRef.current &&
        !categoryRef.current.contains(event.target as Node) &&
        btnCategoryRef.current &&
        !btnCategoryRef.current.contains(event.target as Node)
      ) {
        setIsCategoryOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const categoryOptions = ["Pet clinic (Infield)", "Pet clinic (Admission to TEARS)", "Reported outside of pet clinic"];

  //TYPE
  const handleToggleType = () => {
    setIsTypeOpen(!isTypeOpen);
  };

  //SetStateAction<string>
  const handleTypeOption = (option: string) => {
    setTypeOption(option);
    setIsTypeOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (typeRef.current && !typeRef.current.contains(event.target as Node) && btnTypeRef.current && !btnTypeRef.current.contains(event.target as Node)) {
        setIsTypeOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const typeOptions = [
    "Achilles",
    "Amputation",
    "Anxiety",
    "Arthritis",
    "Babesiosis",
    "Cancer",
    "Constipation",
    "Cruciate",
    "Dental",
    "Distemper",
    "Ear Infection",
    "Ehrlichia",
    "Eye Infection",
    "Feline Aids",
    "Foreign body ingested",
    "Fracture",
    "Heart failure",
    "Hernia",
    "Hot spot",
    "Kennel cough",
    "Limping",
    "Mange",
    "Mastitis",
    "MVA",
    "Nail in paw",
    "Nose bleed",
    "Panleukopenia",
    "Parvo",
    "Pyometra",
    "Renal",
    "Snuffles",
    "Steri complications",
    "TVT",
    "Urinary",
    "Vaccinations (Ad hoc)",
    "Vomiting and diarrhea",
    "Wound shave and clean",
    "Wound stitch-up",
    "Other",
  ];

  //-------------------------------UPDATE USER-----------------------------------------
  //Update the user's details in fields
  const handleUpdateUserProfile = async (id: number) => {
    setID(id);

    if (treatment.data) {
      // Assuming userQuery.data contains the user object
      const userData = treatment.data;
      setCategoryOption(userData.category ?? "Select one");
      setTypeOption(userData.type ?? "Select one");
      setStartingDate(userData?.date ?? new Date());
      setComments(userData.comments ?? "");

      // //Make sure thet area and street options have a value
      // if (userData.area === "") {
      //   setAreaOption("Select one");
      // }
    }

    //isUpdate ? setIsUpdate(true) : setIsUpdate(true);
    //isCreate ? setIsCreate(false) : setIsCreate(false);
    setIsUpdate(true);
    setIsCreate(false);
  };

  useEffect(() => {
    if (treatment.data) {
      // Assuming userQuery.data contains the user object
      const userData = treatment.data;
      setCategoryOption(userData.category ?? "Select one");
      setTypeOption(userData.type ?? "");
      setStartingDate(userData.date ?? new Date());
      setComments(userData.comments ?? "");

      // if (userData.area === "") {
      //   console.log("Area option is select one");
      //   setAreaOption("Select one");
      // }
    }
  }, [treatment.data, isUpdate, isCreate]); // Effect runs when userQuery.data changes

  const handleUpdateUser = async () => {
    await updateTreatment.mutateAsync({
      treatmentID: id,
      category: categoryOption === "Select one" ? "" : categoryOption,
      type: typeOption === "Select one" ? "" : typeOption,
      date: startingDate,
      comments: comments,
    });
    //After the newUser has been created make sure to set the fields back to empty
    setCategoryOption("Select one");
    setTypeOption("Select one");
    setComments("");
    setIsUpdate(false);
    setIsCreate(false);
  };

  //-------------------------------CREATE NEW USER-----------------------------------------

  const handleCreateNewUser = async () => {
    setCategoryOption("Select one");
    setTypeOption("Select one");
    setStartingDate(new Date());
    setComments("");
    //isCreate ? setIsCreate(false) : setIsCreate(true);
    setIsCreate(true);
    setIsUpdate(false);
  };
  //-------------------------------NEW USER-----------------------------------------

  const handleNewUser = async () => {
    await newTreatment.mutateAsync({
      petID: Number(router.asPath.split("=")[1]),
      category: categoryOption === "Select one" ? "" : categoryOption,
      type: typeOption === "Select one" ? "" : typeOption,
      date: startingDate,
      comments: comments,
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

    //console.log("View profile page: ", JSON.stringify(clinic.data));
    if (treatment.data) {
      // Assuming userQuery.data contains the user object
      const userData = treatment.data;
      setCategoryOption(userData.category ?? "");
      setTypeOption(userData.type ?? "");
      setStartingDate(userData.date ?? new Date());
      setComments(userData.comments ?? "");

      // //Make sure thet area and street options have a value
      // if (userData.area === "Select one") {
      //   setAreaOption("");
      //   console.log("Area option is select one");
      // }
    }

    setIsUpdate(false);
    setIsCreate(false);
    setIsViewProfilePage(true);
  };

  useEffect(() => {
    //console.log("View profile page: ", JSON.stringify(user.data));
    if (isViewProfilePage) {
      void treatment.refetch();
    }
    if (treatment.data) {
      const userData = treatment.data;
      setCategoryOption(userData.category ?? "");
      setTypeOption(userData.type ?? "");
      setStartingDate(userData.date ?? new Date());
      setComments(userData.comments ?? "");
      //console.log("Select one");
      // //Make sure thet area and street options have a value
      // if (userData.type === "Select one" && !isUpdate) {
      //   setAreaOption("");
      // }
      // if (userData.area === "" && isUpdate) {
      //   setAreaOption("Select one");
      // }
    }
  }, [isViewProfilePage, treatment.data]); // Effect runs when userQuery.data changes

  //-------------------------------BACK BUTTON-----------------------------------------
  const handleBackButton = () => {
    //console.log("Back button pressed");
    setIsUpdate(false);
    setIsCreate(false);
    setIsViewProfilePage(false);
    setID(0);
    setCategoryOption("Select one");
    setTypeOption("Select one");
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

    if (categoryOption === "Select one") mandatoryFields.push("Greater Area");
    if (startingDate === null) mandatoryFields.push("Date");
    if (typeOption === "Select one") mandatoryFields.push("Area");

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

  //-------------------------------INFINITE SCROLLING WITH INTERSECTION OBSERVER-----------------------------------------
  const observerTarget = useRef<HTMLDivElement | null>(null);

  const [limit] = useState(12);
  const {
    data: queryData,
    fetchNextPage,
    hasNextPage,
    refetch,
  } = api.petTreatment.searchTreatmentsInfinite.useInfiniteQuery(
    {
      treatmentID: id,
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
  const pet_data = queryData?.pages.flatMap((page) => page.pet_data);
  //combine the following two objects into one object
  const treatment_data = user_data?.map((user, index) => ({ ...user, ...pet_data?.[index] }));

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
        <title>Treatment Profiles</title>
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
                {/* <button className="absolute right-0 top-0 mx-3 mb-3 rounded-lg bg-main-orange p-3 text-white hover:bg-orange-500" onClick={handleCreateNewUser}>
                  Create new Clinic
                </button> */}
                {/*<button className="absolute left-0 top-0 mx-3 mb-3 rounded-lg bg-main-orange p-3 hover:bg-orange-500" onClick={handleDeleteAllUsers}>
                  Delete all users
        </button>*/}
              </div>
              <article className="my-6 flex max-h-[80rem] w-full items-center justify-center overflow-auto rounded-md shadow-inner">
                <table className="table-auto">
                  <thead>
                    <tr>
                      <th className="px-4 py-2"></th>
                      <th className="px-4 py-2">
                        <button className={`${order == "date" ? "underline" : ""}`} onClick={() => handleOrderFields("date")}>
                          Date
                        </button>
                      </th>
                      <th className="px-4 py-2">Pet</th>
                      <th className="px-4 py-2">Category</th>
                      <th className="px-4 py-2">
                        Type
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
                    {treatment_data?.map((treatment, index) => {
                      return (
                        <tr className="items-center">
                          <div className="px-4 py-2">{index + 1}</div>
                          <td className="border px-4 py-2">
                            {treatment?.date?.getDate()?.toString() ?? ""}
                            {"/"}
                            {((treatment?.date?.getMonth() ?? 0) + 1)?.toString() ?? ""}
                            {"/"}
                            {treatment?.date?.getFullYear()?.toString() ?? ""}
                          </td>
                          <td className="border px-4 py-2">{treatment.category}</td>
                          <td className="border px-4 py-2">{treatment.type}</td>
                          <td className=" border px-4 py-2">
                            {treatment?.updatedAt?.getDate()?.toString() ?? ""}
                            {"/"}
                            {((treatment?.updatedAt?.getMonth() ?? 0) + 1)?.toString() ?? ""}
                            {"/"}
                            {treatment?.updatedAt?.getFullYear()?.toString() ?? ""}
                          </td>

                          <div className="flex">
                            <Trash
                              size={24}
                              className="mx-2 my-3 rounded-lg hover:bg-orange-200"
                              onClick={() =>
                                handleDeleteModal(
                                  treatment.treatmentID ?? 0,
                                  String(treatment.treatmentID ?? 0),
                                  treatment.date?.getDate()?.toString() +
                                    "/" +
                                    ((treatment.date?.getMonth() ?? 0) + 1)?.toString() +
                                    "/" +
                                    treatment.date?.getFullYear()?.toString() ?? "",
                                )
                              }
                            />
                            <Pencil
                              size={24}
                              className="mx-2 my-3 rounded-lg hover:bg-orange-200"
                              onClick={() => handleUpdateUserProfile(treatment.treatmentID ?? 0)}
                            />
                            <AddressBook
                              size={24}
                              className="mx-2 my-3 rounded-lg hover:bg-orange-200"
                              onClick={() => handleViewProfilePage(treatment.treatmentID ?? 0)}
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
                  <b className="mb-3 text-center text-xl">Pet Treatment Data</b>

                  {/*DATEPICKER*/}
                  <div className="flex items-center">
                    <div className=" flex">
                      1. Date<div className="text-lg text-main-orange">*</div>:{" "}
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
                        2. Category<div className="text-lg text-main-orange">*</div>:{" "}
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <button
                        ref={btnCategoryRef}
                        className="my-3 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                        type="button"
                        onClick={handleToggleCategory}
                      >
                        {isUpdate ? categoryOption : categoryOption + " "}
                        <svg className="ms-3 h-2.5 w-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                        </svg>
                      </button>
                      {isCategoryOpen && (
                        <div ref={categoryRef} className="z-10 w-44 divide-y divide-gray-100 rounded-lg bg-white shadow dark:bg-gray-700">
                          <ul className="py-2 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdownHoverButton">
                            {categoryOptions.map((option) => (
                              <li key={option} onClick={() => handleCategoryOption(option)}>
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
                      <div className=" flex">3. Type: </div>
                    </div>
                    <div className="flex flex-col">
                      <button
                        ref={btnTypeRef}
                        className="my-3 inline-flex items-center rounded-lg bg-main-orange px-2 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                        type="button"
                        onClick={handleToggleType}
                      >
                        {typeOption + " "}
                        <svg className="ms-3 h-2.5 w-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                        </svg>
                      </button>
                      {isTypeOpen && (
                        <div ref={typeRef} className="z-10 w-44 divide-y divide-gray-100 rounded-lg bg-white shadow dark:bg-gray-700">
                          <ul className="py-2 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdownHoverButton">
                            {typeOptions.map((option) => (
                              <li key={option} onClick={() => handleTypeOption(option)}>
                                <button className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">{option}</button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="w-32 pt-3">5. Comments: </div>
                    <textarea
                      className="m-2 h-24 w-full rounded-lg border-2 border-slate-300 px-2 focus:border-black"
                      placeholder="Type here: e.g. Notes on succesfulness, problem areas etc."
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
                <div className=" text-2xl">Treatment Profile</div>
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

                  <b className="mb-14 text-center text-xl">Treatment Data</b>
                  <div className="mb-2 flex items-center">
                    <b className="mr-3">Treatment ID:</b> {treatment?.data?.treatmentID}
                  </div>

                  <div className="mb-2 flex items-center">
                    <b className="mr-3">Date:</b>{" "}
                    {treatment?.data?.date?.getDate() + "/" + ((treatment?.data?.date?.getMonth() ?? 0) + 1) + "/" + treatment?.data?.date?.getFullYear() ?? ""}
                  </div>

                  <div className="mb-2 flex items-center">
                    <b className="mr-3">Category:</b> {treatment?.data?.category}
                  </div>

                  <div className="mb-2 flex items-center">
                    <b className="mr-3">Type:</b> {treatment?.data?.type}
                  </div>

                  <div className="mb-2 flex items-center">
                    <b className="mr-3">Comments:</b> {treatment?.data?.comments}
                  </div>
                </div>
              </div>
            </div>
            <div className="my-6 flex justify-center">
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

export default Treatment;
