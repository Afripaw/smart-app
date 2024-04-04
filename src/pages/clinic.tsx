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

//Excel
import * as XLSX from "xlsx";

//File saver
//import FileSaver from "file-saver";
import * as FileSaver from "file-saver";

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
import Pet from "./pet";

const Clinic: NextPage = () => {
  useSession({ required: true });

  //-------------------------------GREATER AREA-----------------------------------------
  type GreaterArea = {
    id: number;
    area: string;
  };

  //---------------------------------AREA-----------------------------------------------
  type Area = {
    id: number;
    area: string;
  };

  //------------------------------CONDITIONS-----------------------------------------
  type ConditionOptions = {
    condition: string;
    state: boolean;
  };

  type ConditionSelect = {
    allSelected: boolean;
    clear: boolean;
  };

  const newClinic = api.petClinic.create.useMutation();
  const updateClinic = api.petClinic.update.useMutation();
  const [isUpdate, setIsUpdate] = useState(false);
  const [isCreate, setIsCreate] = useState(false);
  //Update the table when user is deleted
  const [isDeleted, setIsDeleted] = useState(false);

  //For moving between different pages
  const router = useRouter();

  //-------------------------------LOADING ANIMATIONS-----------------------------------------
  const [isLoading, setIsLoading] = useState(false);

  //-------------------------------UPDATE IDENTIFICATION-----------------------------------------
  const updateIdentification = api.petClinic.updateIdentification.useMutation();

  //get latest volunteerID
  const latestClinicID = api.petClinic.getLatestClinicID.useQuery();

  //Excel upload
  const insertExcelData = api.petClinic.insertExcelData.useMutation();

  //---------------------------------BULK UPLOAD----------------------------------

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const bstr = event.target?.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0]; // Assuming you're interested in the third sheet [0]
      console.log("Sheet name: ", wsname);
      const ws: XLSX.WorkSheet | undefined = wb.Sheets[wsname as keyof typeof wb.Sheets];
      const data = ws ? XLSX.utils.sheet_to_json(ws) : [];
      console.log("Data: ", data);

      //This is the format that the insertExcelData mutation expects

      type petClinicData = {
        greaterAreaID: number;
        greaterArea: string;
        areaID: number;
        area: string;
        conditions: string[];
        comments: string;
        date: Date; // Or string if you are handling date as a string before conversion.
      };

      //change the data so that it gives me the correct format for each column as in the petOwnerData type
      for (const obj of data as petClinicData[]) {
        console.log("Object: ", obj);

        //obj.conditions = [obj.conditions];
        // // Ensuring conditions is always an array of strings
        // if (!Array.isArray(obj.conditions)) {
        //   obj.conditions = [obj.conditions];
        // } else {
        //   // If conditions is already an array, ensure all its elements are strings
        //   obj.conditions = obj.conditions.map((condition) => String(condition));
        // }
        // // Convert conditions to an array of strings if it's not already
        // if (typeof obj.conditions === "string") {
        //   obj.conditions = [obj.conditions];
        // }
        //obj.conditions = [String(obj.conditions)];
        //obj.conditions = obj.conditions.;

        //Change the format of the date
        obj.date = new Date(obj.date);

        if (Number(obj.date) >= 35000) {
          obj.date = ExcelDateToJSDate(Number(obj.date));
        }
        if (obj.date === undefined) {
          obj.date = new Date(0);
        } else if (String(obj.date) === "None") {
          obj.date = new Date(0);
        } else if (String(obj.date) === "") {
          obj.date = new Date(0);
        } else {
          obj.date = new Date(obj.date);
        }

        //add a comments column
        obj.comments = "";

        //make conditions an array
        obj.conditions = [String(obj.conditions)];
      }

      //Turn the data into this type of object: {firstName: "John", surname: "Doe", email: "xxxxxxx@xxxxx", mobile: "0712345678", address: "1 Main Road, Observatory, Cape Town, 7925", comments: "None"}

      insertExcelData.mutate(data as petClinicData[], {
        onSuccess: () => {
          console.log("Data successfully inserted");
        },
        onError: (error) => {
          console.error("Error inserting data", error);
        },
      });

      // Now data is an array of objects, each object representing a row in the Excel sheet.
      // The keys of each object are the column headers from your Excel sheet.
      // You can directly pass this data to convert_to_json without needing to splice or adjust.
      void convert_to_json(data as Record<string, unknown>[]);
    };
    if (file) {
      reader.readAsBinaryString(file);
    }
  };

  const ExcelDateToJSDate = (serialDate: number): Date => {
    // Excel's epoch starts on January 1, 1900. JavaScript's epoch starts on January 1, 1970.
    // Add the number of days from Excel's epoch to 1/1/1970, which is 25569 days.
    // Adjust for Excel's leap year bug; Excel believes 1900 was a leap year, but it wasn't.
    const daysSinceEpoch = serialDate - 25569 + (serialDate > 59 ? -1 : 0);

    // Convert days to milliseconds
    const msSinceEpoch = daysSinceEpoch * 24 * 60 * 60 * 1000;

    return new Date(msSinceEpoch);
  };

  const convert_to_json = async (data: Array<Record<string, unknown>>) => {
    const rows: string[] = data.map((row) => JSON.stringify(row));
    console.log("Rows: ", rows);
  };

  //-------------------------------SEARCH BAR------------------------------------
  //Query the users table
  const [query, setQuery] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

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
  const deleteAllUsers = api.petClinic.deleteAllClinics.useMutation();
  const handleDeleteAllUsers = async () => {
    await deleteAllUsers.mutateAsync();
    isDeleted ? setIsDeleted(false) : setIsDeleted(true);
  };

  //---------------------------------PRINTING----------------------------------
  const printComponentRef = useRef(null);

  //---------------------------------EDIT BOXES----------------------------------
  const [comments, setComments] = useState("");
  const [startingDate, setStartingDate] = useState(new Date());

  //--------------------------------UNEDITABLE-------------------------------------
  const [dogVisits, setDogVisits] = useState(0);
  const [catVisits, setCatVisits] = useState(0);
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
  const [greaterAreaID, setGreaterAreaID] = useState(0);
  const [isGreaterAreaOpen, setIsGreaterAreaOpen] = useState(false);
  const [greaterAreaOption, setGreaterAreaOption] = useState<GreaterArea>({ area: "Select one", id: 0 });
  const greaterAreaRef = useRef<HTMLDivElement>(null);
  const btnGreaterAreaRef = useRef<HTMLButtonElement>(null);

  const [areaID, setAreaID] = useState(0);
  const [isAreaOpen, setIsAreaOpen] = useState(false);
  const [areaOption, setAreaOption] = useState<Area>({ area: "Select one", id: 0 });
  const areaRef = useRef<HTMLDivElement>(null);
  const btnAreaRef = useRef<HTMLButtonElement>(null);

  const [conditions, setConditions] = useState(false);
  const [conditionOption, setConditionOption] = useState("Select here");
  const conditionRef = useRef<HTMLDivElement>(null);
  const btnConditionRef = useRef<HTMLButtonElement>(null);

  //GREATER AREA
  const handleToggleGreaterArea = () => {
    setIsGreaterAreaOpen(!isGreaterAreaOpen);
  };

  const handleGreaterAreaOption = (option: SetStateAction<string>, id: number) => {
    const greaterArea: GreaterArea = { area: String(option), id: id };
    setGreaterAreaOption(greaterArea);
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

  //const greaterAreaOptions = ["Flagship", "Replication area 1", "Replication area 2"];
  const greaterAreaOptions = api.geographic.getAllGreaterAreas.useQuery()?.data ?? [];

  //AREA
  const handleToggleArea = () => {
    setIsAreaOpen(!isAreaOpen);
  };

  //SetStateAction<string>
  const handleAreaOption = (option: string, id: number) => {
    const area: Area = { area: String(option), id: id };
    setAreaOption(area);
    setIsAreaOpen(false);

    //Makes the options one word for the key of the areaStreetMapping
    // if (option === "Coniston Park") option = "ConistonPark";
    // if (option === "Grassy Park") option = "GrassyPark";
    // if (option === "Lavendar Hill") option = "LavendarHill";
    // if (option === "Costa da Gamma") option = "CostaDaGamma";
    // if (option === "Marina Da Gamma") option = "MarinaDaGamma";
    // if (option === "Montagu V") option = "MontaguV";
    // if (option === "Overcome Heights") option = "OvercomeHeights";
    // if (option === "Pelican Park") option = "PelicanPark";
    // if (option === "Seekoei vlei") option = "Seekoeivlei";
    // if (option === "St Ruth") option = "StRuth";
    // setStreetOptions(areaStreetMapping[option] ?? []);
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

  const areaOptions = api.geographic.getAreasByGreaterID.useQuery({ greaterAreaID: greaterAreaOption.id })?.data ?? [];

  //CONDITIONS
  const handleToggleConditions = () => {
    setConditions(!conditions);
  };

  const handleConditionOption = (option: SetStateAction<string>) => {
    setConditionOption(option);
    setConditions(false);
  };

  //const [greaterAreaListOptions, setGreaterAreaListOptions] = useState<GreaterAreaOptions[]>([]);
  const [conditionListOptions, setConditionListOptions] = useState<ConditionOptions[]>([]);
  const [conditionSelection, setConditionSelection] = useState<ConditionSelect>();
  //to select multiple roles
  const [conditionList, setConditionList] = useState<string[]>([]);

  const handleCondition = (option: SetStateAction<string>, state: boolean, selectionCategory: string) => {
    if (selectionCategory === "allSelected") {
      setConditionOption("Select All");
      setConditionSelection({ allSelected: state, clear: false });

      const conditions = conditionListOptions.map((condition) => condition.condition);
      setConditionList(conditions);
      //order the roleList in alphabetical order
      // setRoleList(roleList.sort((a, b) => a.localeCompare(b)));
      setConditionListOptions(conditionListOptions.map((condition) => ({ ...condition, state: true })));
    } else if (selectionCategory === "clear") {
      setConditionOption("Clear All");
      setConditionSelection({ allSelected: false, clear: state });

      setConditionList([]);
      setConditionListOptions(conditionListOptions.map((condition) => ({ ...condition, state: false })));
    } else if (selectionCategory === "normal") {
      setConditionOption(option);
      setConditionSelection({ allSelected: false, clear: false });
      if (state) {
        if (!conditionList.includes(String(option))) {
          setConditionList([...conditionList, String(option)]);
          //order the roleList in alphabetical order
          // setRoleList(roleList.sort((a, b) => a.localeCompare(b)));
        }

        setConditionListOptions(conditionListOptions.map((condition) => (condition.condition === option ? { ...condition, state: true } : condition)));
        // console.log("Greater Area list: ", greaterAreaList);
        // console.log("Greater Area List Options: ", greaterAreaListOptions);
      } else {
        const updatedConditionList = conditionList.filter((condition) => condition !== option);
        setConditionList(updatedConditionList);
        //order the roleList in alphabetical order
        // setRoleList(roleList.sort((a, b) => a.localeCompare(b)));
        setConditionListOptions(conditionListOptions.map((condition) => (condition.condition === option ? { ...condition, state: false } : condition)));
        // console.log("Greater Area list: ", greaterAreaList);
        // console.log("Greater Area List Options: ", greaterAreaListOptions);
      }
    }
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
    "Unknown",
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

  //GEOGRAPHIC LOCATION
  const getGreaterAreaByID = api.geographic.getGreaterAreaByID.useQuery({ greaterAreaID: greaterAreaID });
  const getAreaByID = api.geographic.getAreaByID.useQuery({ areaID: areaID });
  //Update the user's details in fields
  const handleUpdateUserProfile = async (id: number) => {
    setID(id);

    const clinic = user_data?.find((clinic) => clinic.clinicID === id);
    if (clinic) {
      // Assuming userQuery.data contains the user object
      const userData = clinic;
      const greaterArea: GreaterArea = { area: getGreaterAreaByID.data?.greaterArea ?? "Select one", id: getGreaterAreaByID.data?.greaterAreaID ?? 0 };

      setGreaterAreaOption(greaterArea);

      const area: Area = { area: getAreaByID.data?.area ?? "Select one", id: getAreaByID.data?.areaID ?? 0 };

      setAreaOption(area);

      //Make sure thet area and street options have a value
      if (userData.areaID === 0 || userData.areaID === undefined) {
        setAreaOption({ area: "Select one", id: 0 });
      }

      setStartingDate(userData?.date ?? new Date());
      setComments(userData.comments ?? "");
      setConditionList(userData.conditions ?? "Select here");

      setConditionListOptions(
        conditionOptions.map((condition) => ({
          condition: condition,
          state: userData.conditions.includes(condition),
        })),
      );

      setGreaterAreaID(userData.greaterAreaID ?? 0);
      setAreaID(userData.areaID ?? 0);

      //Make sure thet area and street options have a value
      // if (userData.area?.area === "") {
      //   setAreaOption({ area: "Select one", id: 0 });
      // }

      setDogVisits(userData.pet.filter((pet) => pet.pet.species === "Dog").length);
      setCatVisits(userData.pet.filter((pet) => pet.pet.species === "Cat").length);
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
      const greaterArea: GreaterArea = { area: getGreaterAreaByID.data?.greaterArea ?? "Select one", id: getGreaterAreaByID.data?.greaterAreaID ?? 0 };

      setGreaterAreaOption(greaterArea);

      const area: Area = { area: getAreaByID.data?.area ?? "Select one", id: getAreaByID.data?.areaID ?? 0 };

      setAreaOption(area);

      //Make sure thet area and street options have a value
      if (userData.areaID === 0 || userData.areaID === undefined) {
        setAreaOption({ area: "Select one", id: 0 });
      }
      setStartingDate(userData.date ?? new Date());
      setComments(userData.comments ?? "");
      setConditionList(userData.conditions ?? "Select here");

      setConditionListOptions(
        conditionOptions.map((condition) => ({
          condition: condition,
          state: userData.conditions.includes(condition),
        })),
      );

      setGreaterAreaID(userData.greaterAreaID ?? 0);
      setAreaID(userData.areaID ?? 0);

      // if ((userData.area?.area ?? "") === "") {
      //   console.log("Area option is select one");
      //   setAreaOption({ area: "Select one", id: 0 });
      // }

      setDogVisits(userData.pet.filter((pet) => pet.pet.species === "Dog").length);
      setCatVisits(userData.pet.filter((pet) => pet.pet.species === "Cat").length);
    }
  }, [isUpdate, isCreate]); // Effect runs when userQuery.data changes

  const handleUpdateUser = async () => {
    setIsLoading(true);
    await updateClinic.mutateAsync({
      clinicID: id,
      greaterAreaID: greaterAreaOption.area === "Select one" ? 0 : greaterAreaOption.id,
      //areaID: areaOption.area === "Select one" ? 0 : areaOption.id,
      date: startingDate,
      conditions: conditionList.sort((a, b) => a.localeCompare(b)),
      comments: comments,
    });
    //After the newUser has been created make sure to set the fields back to empty
    setGreaterAreaOption({ area: "Select one", id: 0 });
    //setGreaterAreaID(0);
    setAreaOption({ area: "Select one", id: 0 });
    setConditionOption("Select here");
    setConditionList([]);
    //setGreaterAreaID(0);
    //setAreaID(0);
    setComments("");
    setIsUpdate(false);
    setIsCreate(false);

    setIsLoading(false);
  };

  //-------------------------------CREATE NEW USER-----------------------------------------

  const handleCreateNewUser = async () => {
    setGreaterAreaOption({ area: "Select one", id: 0 });
    setAreaOption({ area: "Select one", id: 0 });
    setStartingDate(new Date());
    setComments("");
    setConditionOption("Select here");
    setConditionListOptions(conditionOptions.map((condition) => ({ condition: condition, state: false })));
    //isCreate ? setIsCreate(false) : setIsCreate(true);
    setIsCreate(true);
    setIsUpdate(false);
  };
  //-------------------------------NEW USER-----------------------------------------

  const handleNewUser = async () => {
    setIsLoading(true);
    const newUser_ = await newClinic.mutateAsync({
      greaterAreaID: greaterAreaOption.area === "Select one" ? 0 : greaterAreaOption.id,
      //  areaID: areaOption.area === "Select one" ? 0 : areaOption.id,
      date: startingDate,
      comments: comments,
      conditions: conditionList.sort((a, b) => a.localeCompare(b)),
    });

    setIsCreate(false);
    setIsUpdate(false);

    // return newUser_;

    //update identification table
    if (newUser_?.clinicID) {
      await updateIdentification.mutateAsync({
        clinicID: newUser_?.clinicID ?? 0,
      });
    }

    setIsLoading(false);
  };

  //-------------------------------VIEW PROFILE PAGE-----------------------------------------
  const [isViewProfilePage, setIsViewProfilePage] = useState(false);
  const handleViewProfilePage = async (id: number) => {
    setIsViewProfilePage(true);
    setID(id);

    const clinic = user_data?.find((clinic) => clinic.clinicID === id);
    console.log("Clinic view profile button has this value for clinic: ", clinic);
    // console.log("View profile page: ", JSON.stringify(clinic.data));
    if (clinic) {
      // Assuming userQuery.data contains the user object
      const userData = clinic;
      const greaterArea: GreaterArea = { area: getGreaterAreaByID.data?.greaterArea ?? "Select one", id: getGreaterAreaByID.data?.greaterAreaID ?? 0 };

      setGreaterAreaOption(greaterArea);

      const area: Area = { area: getAreaByID.data?.area ?? "Select one", id: getAreaByID.data?.areaID ?? 0 };

      setAreaOption(area);

      //Make sure thet area and street options have a value
      if (userData.areaID === 0 || userData.areaID === undefined) {
        setAreaOption({ area: "Select one", id: 0 });
      }
      setStartingDate(userData.date ?? new Date());
      setComments(userData.comments ?? "");
      //setConditionOption(userData.conditions ?? "Select here");

      setConditionList(userData.conditions ?? "");

      setConditionListOptions(
        conditionOptions.map((condition) => ({
          condition: condition,
          state: userData.conditions.includes(condition),
        })),
      );

      setGreaterAreaID(userData.greaterAreaID ?? 0);
      setAreaID(userData.areaID ?? 0);

      setDogVisits(userData.pet.filter((pet) => pet.pet.species === "Dog").length);
      setCatVisits(userData.pet.filter((pet) => pet.pet.species === "Cat").length);
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
      const greaterArea: GreaterArea = { area: getGreaterAreaByID.data?.greaterArea ?? "Select one", id: getGreaterAreaByID.data?.greaterAreaID ?? 0 };

      setGreaterAreaOption(greaterArea);

      const area: Area = { area: getAreaByID.data?.area ?? "Select one", id: getAreaByID.data?.areaID ?? 0 };

      setAreaOption(area);

      setConditionList(userData.conditions ?? "");

      //setGreaterAreaOption(userData.greaterArea.greaterArea ?? "");
      //setAreaOption(userData.area.area ?? "");
      setStartingDate(userData.date ?? new Date());
      setComments(userData.comments ?? "");

      //setGreaterAreaID(userData.greaterAreaID ?? 0);
      //setAreaID(userData.areaID ?? 0);
      //console.log("Select one");
      //Make sure thet area and street options have a value
      if ((userData.areaID === 0 || userData.areaID === undefined) && !isUpdate) {
        setAreaOption({ area: "", id: 0 });
      }
      if (userData.areaID === 0 || (userData.areaID === undefined && isUpdate)) {
        setAreaOption({ area: "Select one", id: 0 });
      }

      setDogVisits(userData.pet.filter((pet) => pet.pet.species === "Dog").length);
      setCatVisits(userData.pet.filter((pet) => pet.pet.species === "Cat").length);
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

    // setQuery("");
    setIsUpdate(false);
    setIsCreate(false);
    setIsViewProfilePage(false);
    setID(0);
    setGreaterAreaOption({ area: "Select one", id: 0 });
    setAreaOption({ area: "Select one", id: 0 });
    setComments("");
    setConditionList([]);
    setConditionOption("Select here");
    setConditionListOptions(conditionOptions.map((condition) => ({ condition: condition, state: false })));
    setConditionSelection({ allSelected: false, clear: false });

    setDogVisits(0);
    setCatVisits(0);
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

    if (greaterAreaOption.area === "Select one") mandatoryFields.push("Greater Area");
    if (startingDate === null) mandatoryFields.push("Date");
    //if (areaOption.area === "Select one") mandatoryFields.push("Area");
    if (conditionOption === "Select here") mandatoryFields.push("Condition");

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
      {isUpdate ? startingDate?.getDate().toString() + "/" + (startingDate.getMonth() + 1).toString() + "/" + startingDate.getFullYear().toString() : value}
    </button>
  );

  //------------------------------------------DOWNLOADING CLINIC TABLE TO EXCEL FILE------------------------------------------
  const downloadClinicTable = api.petClinic.download.useQuery({ searchQuery: query });
  const handleDownloadClinicTable = async () => {
    setIsLoading(true);
    //take the download user table query data and put it in an excel file
    const data = downloadClinicTable.data;
    const fileName = "Clinic Table";
    const fileType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
    const fileExtension = ".xlsx";
    const ws = XLSX.utils.json_to_sheet(data ?? []);
    const wb = { Sheets: { data: ws }, SheetNames: ["data"] };
    const excelBuffer: Uint8Array = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as Uint8Array;
    const dataFile = new Blob([excelBuffer], { type: fileType });
    FileSaver.saveAs(dataFile, fileName + fileExtension);
    setIsLoading(false);
  };

  return (
    <>
      <Head>
        <title>Clinic Profiles</title>
      </Head>
      <main className="flex flex-col text-normal">
        <Navbar />
        {!isCreate && !isUpdate && !isViewProfilePage && (
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
                  <button
                    className="absolute left-0 top-0 mx-3 mb-3 rounded-lg bg-main-orange p-3 text-white hover:bg-orange-500"
                    onClick={handleDownloadClinicTable}
                  >
                    {isLoading ? (
                      <div
                        className="mx-2 inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-current border-white border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
                        role="status"
                      />
                    ) : (
                      <div>Download Pet Clinic Table</div>
                    )}
                  </button>
                  <input
                    className="mt-3 flex w-1/3 rounded-lg border-2 border-zinc-800 px-2"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => {
                      setQuery(getQueryFromSearchPhrase(e.target.value));
                      setSearchQuery(e.target.value);
                    }}
                  />
                  <button
                    className="absolute right-0 top-0 mx-3 mb-3 rounded-lg bg-main-orange p-3 text-white hover:bg-orange-500"
                    onClick={handleCreateNewUser}
                  >
                    Create New Clinic
                  </button>
                  {/* <div className="border-2 bg-gray-300 p-3 text-blue-500">
                    Upload
                    <input type="file" onChange={(e) => void handleUpload(e)} accept=".xlsx, .xls" />
                  </div> */}
                  {/* <button className="absolute left-0 top-0 mx-3 mb-3 rounded-lg bg-main-orange p-3 hover:bg-orange-500" onClick={handleDeleteAllUsers}>
                    Delete all users
                  </button> */}
                </div>
              </div>

              {user_data ? (
                <article className="my-6 flex max-h-[60%] w-full items-center justify-center overflow-auto rounded-md shadow-inner">
                  <table className="table-auto">
                    <thead>
                      <tr>
                        <th className="px-4 py-2"></th>
                        {/* <th className=" px-4 py-2">ID</th> */}
                        <th className="w-[35px] px-4 py-2">
                          <span className="group relative inline-block">
                            <button className={`${order === "date" ? "underline" : ""}`} onClick={() => handleOrderFields("date")}>
                              Clinic Date
                            </button>
                            <span className="absolute right-[-20px] top-full hidden w-[110px] rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 shadow-sm group-hover:block">
                              Sort reverse chronologically
                            </span>
                          </span>
                        </th>

                        <th className="px-4 py-2">Greater Area</th>
                        {/* <th className="px-4 py-2">Area</th> */}

                        <th className="min-w-[20rem] px-4 py-2">
                          Conditions
                          {/* <button className={`${order == "condition" ? "underline" : ""}`} onClick={() => handleOrderFields("condition")}>
                          Conditions
                        </button> */}
                        </th>
                        <th className="max-w-[60px] px-4 py-2">Dog visits</th>
                        <th className="max-w-[60px] px-4 py-2">Cat visits</th>
                        <th className="w-[35px] px-4 py-2">
                          <span className="group relative inline-block">
                            <button className={`${order === "updatedAt" ? "underline" : ""}`} onClick={() => handleOrderFields("updatedAt")}>
                              Last Update
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
                            <td className=" border px-2 py-1">
                              <div className="flex justify-center">{index + 1}</div>
                            </td>
                            {/* <td className="border px-4 py-2">C{user.clinicID}</td> */}
                            <td className="border px-2 py-1">
                              {user?.date?.getDate()?.toString() ?? ""}
                              {"/"}
                              {((user?.date?.getMonth() ?? 0) + 1)?.toString() ?? ""}
                              {"/"}
                              {user?.date?.getFullYear()?.toString() ?? ""}
                            </td>
                            <td className="border px-2 py-1">{user.greaterArea.greaterArea}</td>
                            {/* <td className="border px-2 py-1">{user.area.area}</td> */}

                            <td className="border px-2 py-1">{user.conditions.join("; ")}</td>
                            <td className=" border px-2 py-1">
                              <div className="flex justify-center">{user.pet.filter((pet) => pet.pet.species === "Dog").length}</div>
                            </td>
                            <td className=" border px-2 py-1">
                              <div className="flex justify-center">{user.pet.filter((pet) => pet.pet.species === "Cat").length}</div>
                            </td>
                            <td className=" border px-2 py-1">
                              {user?.updatedAt?.getDate()?.toString() ?? ""}
                              {"/"}
                              {((user?.updatedAt?.getMonth() ?? 0) + 1)?.toString() ?? ""}
                              {"/"}
                              {user?.updatedAt?.getFullYear()?.toString() ?? ""}
                            </td>

                            <div className="flex">
                              <div className="relative flex items-center justify-center">
                                <span className="group relative mx-[5px] my-3 flex items-center justify-center rounded-lg hover:bg-orange-200">
                                  <Trash
                                    size={24}
                                    className="block"
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
                                  <span className="absolute bottom-full hidden rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 shadow-sm group-hover:block">
                                    Delete clinic
                                  </span>
                                </span>
                              </div>

                              <div className="relative flex items-center justify-center">
                                <span className="group relative mx-[5px] my-3 flex items-center justify-center rounded-lg hover:bg-orange-200">
                                  <Pencil size={24} className="block" onClick={() => handleUpdateUserProfile(user.clinicID ?? 0)} />
                                  <span className="absolute bottom-full hidden rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 shadow-sm group-hover:block">
                                    Update clinic
                                  </span>
                                </span>
                              </div>

                              <div className="relative flex items-center justify-center">
                                <span className="group relative mx-[5px] my-3 flex items-center justify-center rounded-lg hover:bg-orange-200">
                                  <AddressBook size={24} className="block" onClick={() => handleViewProfilePage(user.clinicID ?? 0)} />
                                  <span className="absolute bottom-full hidden w-[86px] rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 shadow-sm group-hover:block">
                                    View clinic profile
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
              ) : (
                <div className="flex items-center justify-center pt-10">
                  <div
                    className="mx-2 inline-block h-24 w-24 animate-spin rounded-full border-8 border-solid border-current border-main-orange border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
                    role="status"
                  />
                </div>
              )}
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
                    Back To Clinic Table
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

                  <div className="flex py-2">
                    Clinic ID: <div className="px-3">C{isCreate ? String((latestClinicID?.data?.clinicID ?? 0) + 1) : id}</div>
                  </div>
                  {/*DATEPICKER*/}
                  <div className="flex items-center">
                    <label>
                      Date<span className="text-lg text-main-orange">*</span>:{" "}
                    </label>

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
                      <label>
                        Greater Area<span className="text-lg text-main-orange">*</span>:{" "}
                      </label>
                    </div>
                    <div className="flex flex-col">
                      <button
                        ref={btnGreaterAreaRef}
                        className="my-3 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                        type="button"
                        onClick={handleToggleGreaterArea}
                      >
                        {isUpdate ? greaterAreaOption.area : greaterAreaOption.area + " "}
                        <svg className="ms-3 h-2.5 w-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                        </svg>
                      </button>
                      {isGreaterAreaOpen && (
                        <div ref={greaterAreaRef} className="z-10 w-44 divide-y divide-gray-100 rounded-lg bg-white shadow dark:bg-gray-700">
                          <ul className="py-2 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdownHoverButton">
                            {greaterAreaOptions.map((option) => (
                              <li key={option.greaterAreaID} onClick={() => handleGreaterAreaOption(option.greaterArea, option.greaterAreaID)}>
                                <button className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">{option.greaterArea}</button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* <div className="flex items-start">
                    <div className="mr-3 flex items-center pt-5">
                      <div className=" flex">
                        Area<div className="text-lg text-main-orange">*</div>:{" "}
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <button
                        ref={btnAreaRef}
                        className="my-3 inline-flex items-center rounded-lg bg-main-orange px-2 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                        type="button"
                        onClick={handleToggleArea}
                      >
                        {areaOption.area + " "}
                        <svg className="ms-3 h-2.5 w-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                        </svg>
                      </button>
                      {isAreaOpen && (
                        <div ref={areaRef} className="z-10 w-44 divide-y divide-gray-100 rounded-lg bg-white shadow dark:bg-gray-700">
                          <ul className="py-2 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdownHoverButton">
                            {areaOptions.map((option) => (
                              <li key={option.areaID} onClick={() => handleAreaOption(option.area, option.areaID)}>
                                <button className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">{option.area}</button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div> */}

                  {/*CONDITIONS*/}
                  <div className="flex items-start">
                    <div className="mr-3 flex items-center pt-4">
                      <label>
                        Condition(s)<span className="text-lg text-main-orange">*</span>:{" "}
                      </label>
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
                          {/* <ul className="py-2 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdownHoverButton">
                            {conditionOptions.map((option) => (
                              <li key={option} onClick={() => handleConditionOption(option)}>
                                <button className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">{option}</button>
                              </li>
                            ))}
                          </ul> */}

                          <ul className="py-2 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdownHoverButton">
                            <li key={1}>
                              <div className="flex items-center px-4">
                                <input
                                  id="1"
                                  type="checkbox"
                                  checked={conditionSelection?.allSelected}
                                  onChange={(e) => handleCondition("", e.target.checked, "allSelected")}
                                  className="h-4 w-4 rounded bg-gray-100 text-main-orange accent-main-orange focus:ring-2"
                                />
                                <label htmlFor="1" className="ms-2 text-sm font-medium text-gray-900">
                                  Select All
                                </label>
                              </div>
                            </li>
                            <li key={2}>
                              <div className="flex items-center px-4">
                                <input
                                  id="2"
                                  type="checkbox"
                                  checked={conditionSelection?.clear}
                                  onChange={(e) => handleCondition("", e.target.checked, "clear")}
                                  className="h-4 w-4 rounded bg-gray-100 text-main-orange accent-main-orange focus:ring-2"
                                />
                                <label htmlFor="2" className="ms-2 text-sm font-medium text-gray-900">
                                  Clear All
                                </label>
                              </div>
                            </li>
                            {conditionListOptions?.map((option) => (
                              <li key={option.condition}>
                                <div className="flex items-center px-4">
                                  <input
                                    id={String(option.condition)}
                                    type="checkbox"
                                    checked={option.state}
                                    onChange={(e) => handleCondition(option.condition, e.target.checked, "normal")}
                                    className="h-4 w-4 rounded bg-gray-100 text-main-orange accent-main-orange focus:ring-2"
                                  />
                                  <label htmlFor={String(option.condition)} className="ms-2 text-sm font-medium text-gray-900">
                                    {option.condition}
                                  </label>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  {isUpdate && (
                    <>
                      <div className="flex py-2">
                        Dog Visits: <div className="px-3">{dogVisits}</div>
                      </div>

                      <div className="flex py-2">
                        Cat Visits: <div className="px-3">{catVisits}</div>
                      </div>
                    </>
                  )}

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
                {isLoading ? (
                  <div
                    className="mx-2 inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-current border-white border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
                    role="status"
                  />
                ) : (
                  <div>{isUpdate ? "Update" : "Create"}</div>
                )}
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
                    Back To Clinic Table
                  </button>
                </div>
              </div>
            </div>
            <div ref={printComponentRef} className="flex grow flex-col items-center">
              <div className="print-div mt-6 flex w-[40%] max-w-xl flex-col items-start">
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
                    <b className="mr-3">Clinic ID:</b> C{id}
                  </div>

                  <div className="mb-2 flex items-center">
                    <b className="mr-3">Date:</b>{" "}
                    {startingDate?.getDate() + "/" + ((startingDate?.getMonth() ?? 0) + 1) + "/" + startingDate?.getFullYear() ?? ""}
                  </div>

                  <div className="mb-2 flex items-center">
                    <b className="mr-3">Greater Area:</b> {greaterAreaOption.area}
                  </div>

                  {/* {user.pet.filter((pet) => pet.pet.species === "Dog").length} */}

                  {/* <div className="mb-2 flex items-center">
                    <b className="mr-3">Area:</b> {areaOption.area}
                  </div> */}

                  <div className="mb-2 flex items-center">
                    <b className="mr-3">Condition(s):</b>{" "}
                    {conditionList
                      .sort((a, b) => a.localeCompare(b))
                      .map((condition) => condition)
                      .join("; ")}
                  </div>

                  <div className="mb-2 flex items-center">
                    <b className="mr-3">Dog Visits:</b> {dogVisits}
                  </div>

                  <div className="mb-2 flex items-center">
                    <b className="mr-3">Cat Visits:</b> {catVisits}
                  </div>

                  <div className="mb-2 flex items-center">
                    <b className="mr-3">Comments:</b> {comments}
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
