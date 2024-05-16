import { type NextPage } from "next";
import Head from "next/head";
import React, { SetStateAction, use, useEffect, useRef, useState } from "react";
import { api } from "~/utils/api";
import ReactToPrint from "react-to-print";
import Image from "next/image";
import { useRouter } from "next/router";
//Components
import Navbar from "../components/navbar";
import CreateButtonModal from "../components/createButtonModal";
import TreatmentModal from "../components/treatmentModal";
import DeleteButtonModal from "~/components/deleteButtonModal";
import ImageUploadModal from "~/components/imageUploadModal";
import { areaOptions } from "~/components/GeoLocation/areaOptions";
import { areaStreetMapping } from "~/components/GeoLocation/areaStreetMapping";
import { clinicDates } from "~/components/clinicsAttended";

//Excel
import * as XLSX from "xlsx";

//File saver
//import FileSaver from "file-saver";
import * as FileSaver from "file-saver";

//Icons
import { AddressBook, FirstAidKit, Pencil, Printer, Trash, UserCircle, Users, Bed, Info, Dog } from "phosphor-react";

//Date picker
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { UploadButton } from "~/utils/uploadthing";
import { useSession } from "next-auth/react";
import Input from "~/components/Base/Input";
import { bg } from "date-fns/locale";
import { set } from "date-fns";
import { string } from "zod";
import { error } from "console";

//permissions
import usePageAccess from "../hooks/usePageAccess";

const Pet: NextPage = () => {
  //checks user session and page access
  useSession({ required: true });
  const hasAccess = usePageAccess(["System Administrator", "Data Analyst", "Treatment Data Capturer", "General Data Capturer"]);
  const { data: ownUser } = api.user.getOwnUser.useQuery();

  //For moving between different pages
  const router = useRouter();

  const newPet = api.pet.create.useMutation();
  const updatePet = api.pet.update.useMutation();
  const [isUpdate, setIsUpdate] = useState(false);
  const [isCreate, setIsCreate] = useState(false);
  const [isViewProfilePage, setIsViewProfilePage] = useState(false);
  const [isDoneUploading, setIsDoneUploading] = useState(false);
  //Update the table when user is deleted
  const [isDeleted, setIsDeleted] = useState(false);

  //-------------------------------LOADING ANIMATIONS-----------------------------------------
  const [isLoading, setIsLoading] = useState(false);

  //-------------------------------UPDATE IDENTIFICATION-----------------------------------------
  const updateIdentification = api.pet.updateIdentification.useMutation();

  //get latest petID
  const latestPetID = api.pet.getLatestPetID.useQuery(undefined, { enabled: hasAccess });

  //-------------------------------TREATMENTS-----------------------------------------
  type Treatment = {
    treatmentID: number;
    date: string;
    category: string;
    type: string[];
    comments: string;
  };

  //------------------------------COLOURS-----------------------------------------
  type ColourOptions = {
    colour: string;
    state: boolean;
  };

  type ColourSelect = {
    allSelected: boolean;
    clear: boolean;
  };

  //-------------------------------BREEDS-----------------------------------------
  type BreedOptions = {
    breed: string;
    state: boolean;
  };

  type BreedSelect = {
    allSelected: boolean;
    clear: boolean;
  };

  const [treatmentList, setTreatmentList] = useState<Treatment[]>([]);

  //Excel upload
  const insertExcelData = api.pet.insertExcelData.useMutation();

  //---------------------------------BULK UPLOAD----------------------------------

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const bstr = event.target?.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0]; // Assuming you're interested in the third sheet  [3]
      // console.log("Sheet name: ", wsname);
      const ws: XLSX.WorkSheet | undefined = wb.Sheets[wsname as keyof typeof wb.Sheets];
      const data = ws ? XLSX.utils.sheet_to_json(ws) : [];
      //  console.log("Data: ", data);

      //This is the format that the insertExcelData mutation expects

      type petData = {
        ownerID: number;
        petName: string;
        species: string;
        sex: string;
        age: string;
        breed: string[];
        colour: string[];
        size: string;
        markings: string;
        status: string;
        sterilisedStatus: Date;
        sterilisedRequested: Date;
        sterilisedRequestSigned: string;
        sterilisationOutcome: string;
        sterilisationOutcomeDate: Date;
        vaccinationShot1: Date;
        vaccinationShot2: Date;
        vaccinationShot3: Date;
        // clinicsAttended: number[];
        lastDeworming: Date; // Or string if you are handling date as a string before conversion.
        membership: string;
        membershipDate: Date;
        cardStatus: string;
        kennelReceived: string[];
        comments: string;
      };

      //change the data so that it gives me the correct format for each column as in the petOwnerData type
      for (const obj of data as petData[]) {
        // console.log("Object: ", obj);
        //Object.keys(obj).forEach((key) => {
        //  console.log("Key: ", key);
        //}
        //take the first character away from the ownerID
        //obj.ownerID = Number(obj.ownerID.toString().slice(1));
        // console.log("Owner ID: ", obj.ownerID);
        //last dewroming
        //  console.log("Last deworming from data: ", obj.lastDeworming);
        //if (obj.lastDeWorming !== ) {
        //  obj.lastDeWorming = new Date();
        //} else {
        //obj.lastDeworming = obj.lastDeworming !== undefined ? new Date(obj.lastDeworming) : new Date(0);
        if (Number(obj.lastDeworming) >= 35000) {
          obj.lastDeworming = ExcelDateToJSDate(Number(obj.lastDeworming));
        }
        if (obj.lastDeworming === undefined) {
          obj.lastDeworming = new Date(0);
        } else if (String(obj.lastDeworming) === "None") {
          obj.lastDeworming = new Date(0);
        } else if (String(obj.lastDeworming) === "") {
          obj.lastDeworming = new Date(0);
        } else {
          obj.lastDeworming = new Date(obj.lastDeworming);
        }
        //  console.log("Last deworming after manipulation: ", obj.lastDeworming);

        //comments
        obj.comments = "";

        //clinicsAttended.  Make array of numbers
        //obj.clinicsAttended = [];

        //kennelReceived
        obj.kennelReceived = [""];

        obj.size = obj.size ?? "";

        //sterilisationStatus
        // console.log("Sterilisation status from data: ", obj.sterilisedStatus);
        if (Number(obj.sterilisedStatus) >= 35000) {
          obj.sterilisedStatus = ExcelDateToJSDate(Number(obj.sterilisedStatus));
        }
        if (obj.sterilisedStatus === undefined) {
          obj.sterilisedStatus = new Date(0);
        } else if (String(obj.sterilisedStatus) === "None") {
          obj.sterilisedStatus = new Date(0);
        } else if (String(obj.sterilisedStatus) === "") {
          obj.sterilisedStatus = new Date(0);
        } else {
          obj.sterilisedStatus = new Date(obj.sterilisedStatus);
        }

        //sterilisationRequested
        // console.log("Sterilisation requested from data: ", obj.sterilisedRequested);
        if (Number(obj.sterilisedRequested) >= 35000) {
          obj.sterilisedRequested = ExcelDateToJSDate(Number(obj.sterilisedRequested));
        }
        if (obj.sterilisedRequested === undefined) {
          obj.sterilisedRequested = new Date(0);
        } else if (String(obj.sterilisedRequested) === "None") {
          obj.sterilisedRequested = new Date(0);
        } else if (String(obj.sterilisedRequested) === "") {
          obj.sterilisedRequested = new Date(0);
        } else {
          obj.sterilisedRequested = new Date(obj.sterilisedRequested);
        }

        //vaccinationShot1
        //  console.log("Vaccination shot 1 from data: ", obj.vaccinationShot1);
        if (Number(obj.vaccinationShot1) >= 35000) {
          obj.vaccinationShot1 = ExcelDateToJSDate(Number(obj.vaccinationShot1));
        }
        if (obj.vaccinationShot1 === undefined) {
          obj.vaccinationShot1 = new Date(0);
        } else if (String(obj.vaccinationShot1) === "None") {
          obj.vaccinationShot1 = new Date(0);
        } else if (String(obj.vaccinationShot1) === "") {
          obj.vaccinationShot1 = new Date(0);
        } else {
          obj.vaccinationShot1 = new Date(obj.vaccinationShot1);
        }
        // if (String(obj.vaccinationShot1) !== "None") {
        //   obj.vaccinationShot1 = obj.vaccinationShot1 !== undefined ? new Date(obj.vaccinationShot1) : new Date(0);
        // } else if (String(obj.vaccinationShot1) === "None") {
        //   obj.vaccinationShot1 = new Date(0);
        // }
        // console.log("Vaccination shot 1 after manipulation: ", obj.vaccinationShot1);

        //vaccinationShot2
        // console.log("Vaccination shot 2 from data: ", obj.vaccinationShot2);
        if (Number(obj.vaccinationShot2) >= 35000) {
          obj.vaccinationShot2 = ExcelDateToJSDate(Number(obj.vaccinationShot2));
        }
        if (obj.vaccinationShot2 === undefined) {
          obj.vaccinationShot2 = new Date(0);
        } else if (String(obj.vaccinationShot2) === "None") {
          obj.vaccinationShot2 = new Date(0);
        } else if (String(obj.vaccinationShot2) === "") {
          obj.vaccinationShot2 = new Date(0);
        } else {
          obj.vaccinationShot2 = new Date(obj.vaccinationShot2);
        }
        //obj.vaccinationShot2 = obj.vaccinationShot2 !== undefined || String(obj.vaccinationShot2) !== "None" ? new Date(obj.vaccinationShot2) : new Date(0);
        //  console.log("Vaccination shot 2 after manipulation: ", obj.vaccinationShot2);

        //vaccinationShot3
        //  console.log("Vaccination shot 3 from data: ", obj.vaccinationShot3);
        if (Number(obj.vaccinationShot3) >= 35000) {
          obj.vaccinationShot3 = ExcelDateToJSDate(Number(obj.vaccinationShot3));
        }
        if (obj.vaccinationShot3 === undefined) {
          obj.vaccinationShot3 = new Date(0);
        } else if (String(obj.vaccinationShot3) === "None") {
          obj.vaccinationShot3 = new Date(0);
        } else if (String(obj.vaccinationShot3) === "") {
          obj.vaccinationShot3 = new Date(0);
        } else {
          obj.vaccinationShot3 = new Date(obj.vaccinationShot3);
        }
        //obj.vaccinationShot3 = obj.vaccinationShot3 !== undefined || String(obj.vaccinationShot3) !== "None" ? new Date(obj.vaccinationShot3) : new Date(0);
        // console.log("Vaccination shot 3 after manipulation: ", obj.vaccinationShot3);

        //markinbgs
        obj.markings = "";

        //make colour an array
        obj.colour = [String(obj.colour)];

        //make breed an array
        obj.breed = [String(obj.breed)];
      }

      //Turn the data into this type of object: {firstName: "John", surname: "Doe", email: "xxxxxxx@xxxxx", mobile: "0712345678", address: "1 Main Road, Observatory, Cape Town, 7925", comments: "None"}

      insertExcelData.mutate(data as petData[], {
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
      //void convert_to_json(data as Record<string, unknown>[]);
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

  // const convert_to_json = async (data: Array<Record<string, unknown>>) => {
  //   const rows: string[] = data.map((row) => JSON.stringify(row));
  //   console.log("Rows: ", rows);
  // };

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

    // console.log(phrase);

    return phrase;
  };

  //-------------------------------TABLE-----------------------------------------
  //const data = api.user.searchUsers.useQuery({ searchQuery: query });
  //delete specific row
  const deleteRow = api.pet.deletePet.useMutation();
  const handleDeleteRow = async (id: number) => {
    setIsDeleteModalOpen(false);
    await deleteRow.mutateAsync({ petID: id });
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
  const [order, setOrder] = useState("address");

  //------------------------------KENNELS-----------------------------------------
  type KennelOptions = {
    year: string;
    state: boolean;
  };

  type KennelSelect = {
    allSelected: boolean;
    clear: boolean;
  };

  //-------------------------------CLINICS ATTENDED-----------------------------------------
  type Clinic = {
    id: number;
    date: string;
    area: string;
  };

  type ClinicOptions = {
    id: number;
    date: string;
    area: string;
    state: boolean;
  };

  type ClinicSelect = {
    allSelected: boolean;
    clear: boolean;
  };
  // //-------------------------------CLINICS ATTENDED-----------------------------------------
  // type Clinic = {
  //   id: number;
  //   date: string;
  //   area: string;
  // };
  //The list of clinics that the user has attended
  const [clinicList, setClinicList] = useState<Clinic[]>([]);
  //const [clinicIDList, setClinicIDList] = useState<number[]>([]);

  //-------------------------------INFINITE SCROLLING WITH INTERSECTION OBSERVER-----------------------------------------
  const [dataReturned, setDataReturned] = useState(false);
  const observerTarget = useRef<HTMLDivElement | null>(null);

  const [limit] = useState(12);
  const {
    data: queryData,
    fetchNextPage,
    hasNextPage,
    refetch,
  } = api.pet.searchPetsInfinite.useInfiniteQuery(
    {
      petID: id,
      limit: limit,
      searchQuery: query,
      order: order,
    },
    {
      getNextPageParam: (lastPage) => {
        //  console.log("Next Cursor: " + lastPage.nextCursor);
        return lastPage.nextCursor;
      },
      enabled: false,
    },
  );

  //------------------------------NEW CODE----------------------------------

  // //
  const pet_data_with_clinics_and_treatments = queryData?.pages.flatMap((page) => page.pet_data);

  //const user = pet_data_with_clinics_and_treatments?.find((pet) => pet.petID === id);

  //--------------------------------NEW CODE----------------------------------

  //--------------------------------------------ORIGINAL CODE----------------------------------------------
  // //Flattens the pages array into one array
  // const user_data = queryData?.pages.flatMap((page) => page.user_data);
  // const owner_data = queryData?.pages.flatMap((page) => page.owner_data);
  // const clinic_data = queryData?.pages.flatMap((page) => page.clinic_data);
  // const treatment_data = queryData?.pages.flatMap((page) => page.treatment_data);
  // //combine the following two objects into one object
  // //const pet_data = user_data?.map((user, index) => ({ ...user, ...owner_data?.[index] }));

  // // Assuming each user object contains an ownerId or similar property to relate to the owner
  // const pet_data = user_data?.map((user) => {
  //   // Find the owner that matches the user's ownerId
  //   const owner = owner_data?.find((o) => o.ownerID === user.ownerID);
  //   // Combine the user data with the found owner data
  //   return { ...user, ...owner };
  // });

  // const pet_data_with_clinics = pet_data?.map((pet) => {
  //   // Assuming each clinic object has a 'petID' that links it to a pet
  //   const associatedClinics = clinic_data?.filter((clinic) => clinic.petID === pet.petID);

  //   return {
  //     ...pet,
  //     clinics: associatedClinics,
  //   };
  // });

  // const pet_data_with_clinics_and_treatments = pet_data_with_clinics?.map((pet) => {
  //   // Assuming each treatment object has a 'petID' that links it to a pet
  //   const associatedTreatments = treatment_data?.filter((treatment) => treatment.petID === pet.petID);

  //   return {
  //     ...pet,
  //     treatment: associatedTreatments,
  //   };
  // });

  //--------------------------------------------ORIGINAL CODE----------------------------------------------

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
  }, [fetchNextPage, hasNextPage, observerTarget, isUpdate]);

  //Make it retrieve the data from table again when table is reordered or queried or the user is updated, deleted or created
  useEffect(() => {
    void refetch();
  }, [isUpdate, isDeleted, isCreate, query, order, clinicList]);
  //clinicList,  isDoneUploading
  //[isUpdate, isDeleted, isCreate, query, order, clinicIDList, clinicList]

  const user = pet_data_with_clinics_and_treatments?.find((user) => user.petID === id);

  //-------------------------------DELETE ALL USERS-----------------------------------------
  //Delete all users
  const deleteAllUsers = api.pet.deleteAllPets.useMutation();
  const handleDeleteAllUsers = async () => {
    await deleteAllUsers.mutateAsync();
    isDeleted ? setIsDeleted(false) : setIsDeleted(true);
  };

  //---------------------------------PRINTING----------------------------------
  const printComponentRef = useRef(null);

  //---------------------------------EDIT BOXES----------------------------------
  const [petName, setPetName] = useState("");
  const [ownerID, setOwnerID] = useState(0);
  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [greaterArea, setGreaterArea] = useState("");
  const [area, setArea] = useState("");

  const [markings, setMarkings] = useState("");
  const [comments, setComments] = useState("");
  const [startingDate, setStartingDate] = useState(new Date());
  const [image, setImage] = useState("");

  //userID
  //const [userID, setUserID] = useState("");
  // const [id, setID] = useState(0);

  //---------------------------------NAVIGATION OF OWNER TO PET----------------------------------

  useEffect(() => {
    if (router.asPath.includes("ownerID")) {
      // const path = router.asPath.split("?")[1] ?? "";

      // console.log("Owner ID at line 532: ", Number(router.asPath.split("=")[1]));
      setOwnerID(Number(router.asPath.split("=")[1]));

      //setFirstName(owner?.data?.firstName);
      //setSurname(owner?.data?.surname);

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

      //setIsCreate(true);
      void handleCreateNewUser(
        Number((router.asPath.split("?")[1] ?? "")?.split("&")[0]?.split("=")[1]),
        String((router.asPath.split("?")[1] ?? "")?.split("&")[1]?.split("=")[1]?.replaceAll("+", " ")),
        String((router.asPath.split("?")[1] ?? "")?.split("&")[2]?.split("=")[1]?.replaceAll("+", " ")),
      );
    }
    if (router.asPath.includes("petID")) {
      setIsViewProfilePage(true);
      setID(Number(router.asPath.split("=")[1]));
      void handleViewProfilePage(Number(router.asPath.split("=")[1]));
    }
  }, [router.asPath]);

  const pet_ = router.asPath.includes("petID") ? api.pet.getPetByID.useQuery({ petID: Number(router.asPath.split("=")[1]) }) : null;
  // const pet = router.asPath.includes("petID")
  //   ? api.pet.getPetByID.useQuery({ petID: Number(router.asPath.split("=")[1]) })
  //   : api.pet.getPetByID.useQuery({ petID: 0 });

  // console.log("Pet: ", pet.data);

  //make sure the ownerID is not 0
  // useEffect(() => {
  //   if (ownerID != 0 && isCreate && router.asPath.includes("ownerID")) {
  //     console.log("Owner ID at line 585: ", Number(router.asPath.split("=")[1]));
  //     setOwnerID(Number(router.asPath.split("=")[1]));
  //   }
  // }, [isCreate]);

  //-------------------------------NAVIGATING BY CLICKING ON THE TAB---------------------
  // useEffect(() => {
  //   if (!isCreate) {
  //     setOwnerID(Number(user?.ownerID ?? 0));
  //   }
  // }, [router.asPath]);

  //Code I commented out on 23/4/2024
  // if (router.asPath.includes("petID")) {
  //   useEffect(() => {
  //     if (!isCreate) {
  //       setOwnerID(Number(user?.ownerID ?? 0));
  //     }
  //   }, [router?.asPath]);
  // }

  //Code I commented out on 19/4/2024
  //  const owner = api.petOwner.getOwnerByID.useQuery({ ownerID: ownerID });

  // useEffect(() => {
  //    void owner.refetch();
  // }, []);

  // const handleNavbarLinkClick = () => {
  //   setIsUpdate(false);
  //   setIsCreate(false);
  //   setIsViewProfilePage(false);
  // };

  //-------------------------------UPDATE USER-----------------------------------------
  //const user = api.pet.getPetByID.useQuery({ petID: id });

  //commented out on 16 may 2024
  // if (typeof api.pet.addClinicToPet.useMutation === "function") {
  //   console.log("useMutation is a function");
  //   // const addClinic = api.pet.addClinicToPet.useMutation();
  // } else {
  //   console.error("useMutation is not a function, it's:", typeof api.pet.addClinicToPet.useMutation);
  // }

  //Add clinic to pet
  //console.log("addClinicToPet: ", api.pet.addClinicToPet.useMutation());
  const addClinic = api.pet.addClinicToPet.useMutation();
  //console.log("addClinicToPet: ", addClinic);

  //Order fields
  // const [order, setOrder] = useState("petName");

  //--------------------------------CREATE NEW USER DROPDOWN BOXES--------------------------------
  //WEBHOOKS FOR DROPDOWN BOXES
  const [isSpeciesOpen, setIsSpeciesOpen] = useState(false);
  const [speciesOption, setSpeciesOption] = useState("Select one");
  const speciesRef = useRef<HTMLDivElement>(null);
  const btnSpeciesRef = useRef<HTMLButtonElement>(null);

  const [isSexOpen, setIsSexOpen] = useState(false);
  const [sexOption, setSexOption] = useState("Select one");
  const sexRef = useRef<HTMLDivElement>(null);
  const btnSexRef = useRef<HTMLButtonElement>(null);

  const [isAgeOpen, setIsAgeOpen] = useState(false);
  const [ageOption, setAgeOption] = useState("Select one");
  const ageRef = useRef<HTMLDivElement>(null);
  const btnAgeRef = useRef<HTMLButtonElement>(null);

  const [isBreedOpen, setIsBreedOpen] = useState(false);
  const [breedOption, setBreedOption] = speciesOption == "Cat" ? useState("Not Applicable") : useState("Select one");
  const breedRef = useRef<HTMLDivElement>(null);
  const btnBreedRef = useRef<HTMLButtonElement>(null);

  const [isColourOpen, setIsColourOpen] = useState(false);
  const [colourOption, setColourOption] = useState("Select here");
  const colourRef = useRef<HTMLDivElement>(null);
  const btnColourRef = useRef<HTMLButtonElement>(null);

  const [size, setSize] = useState(false);
  const [sizeOption, setSizeOption] = useState("Select one");
  const sizeRef = useRef<HTMLDivElement>(null);
  const btnSizeRef = useRef<HTMLButtonElement>(null);

  const [status, setStatus] = useState(false);
  const [statusOption, setStatusOption] = useState("Select one");
  const statusRef = useRef<HTMLDivElement>(null);
  const btnStatusRef = useRef<HTMLButtonElement>(null);

  const [sterilisationStatus, setSterilisationStatus] = useState(false);
  const [sterilisationStatusOption, setSterilisationStatusOption] = useState("Select one");
  const sterilisationStatusRef = useRef<HTMLDivElement>(null);
  const btnSterilisationStatusRef = useRef<HTMLButtonElement>(null);
  const [sterilisationStatusDate, setSterilisationStatusDate] = useState(new Date());

  const [sterilisationRequested, setSterilisationRequested] = useState(false);
  const [sterilisationRequestedOption, setSterilisationRequestedOption] = useState("Select one");
  const sterilisationRequestedRef = useRef<HTMLDivElement>(null);
  const btnSterilisationRequestedRef = useRef<HTMLButtonElement>(null);
  const [sterilisationRequestedDate, setSterilisationRequestedDate] = useState(new Date());

  const [sterilisationRequestSigned, setSterilisationRequestSigned] = useState(false);
  const [sterilisationRequestSignedOption, setSterilisationRequestSignedOption] = useState("Select one");
  const sterilisationRequestSignedRef = useRef<HTMLDivElement>(null);
  const btnSterilisationRequestSignedRef = useRef<HTMLButtonElement>(null);

  const [sterilisationOutcome, setSterilisationOutcome] = useState(false);
  const [sterilisationOutcomeOption, setSterilisationOutcomeOption] = useState("Select one");
  const sterilisationOutcomeRef = useRef<HTMLDivElement>(null);
  const btnSterilisationOutcomeRef = useRef<HTMLButtonElement>(null);
  const [sterilisationOutcomeDate, setSterilisationOutcomeDate] = useState(new Date());

  const [vaccinationShot1, setVaccinationShot1] = useState(false);
  const [vaccinationShot1Option, setVaccinationShot1Option] = useState("Select one");
  const vaccinationShot1Ref = useRef<HTMLDivElement>(null);
  const btnVaccinationShot1Ref = useRef<HTMLButtonElement>(null);
  const [vaccinationShot1Date, setVaccinationShot1Date] = useState(new Date());

  const [vaccinationShot2, setVaccinationShot2] = useState(false);
  const [vaccinationShot2Option, setVaccinationShot2Option] = useState("Select one");
  const vaccinationShot2Ref = useRef<HTMLDivElement>(null);
  const btnVaccinationShot2Ref = useRef<HTMLButtonElement>(null);
  const [vaccinationShot2Date, setVaccinationShot2Date] = useState(new Date());

  const [vaccinationShot3, setVaccinationShot3] = useState(false);
  const [vaccinationShot3Option, setVaccinationShot3Option] = useState("Select one");
  const vaccinationShot3Ref = useRef<HTMLDivElement>(null);
  const btnVaccinationShot3Ref = useRef<HTMLButtonElement>(null);
  const [vaccinationShot3Date, setVaccinationShot3Date] = useState(new Date());

  const [membershipType, setMembershipType] = useState(false);
  const [membershipTypeOption, setMembershipTypeOption] = useState("Select one");
  const membershipTypeRef = useRef<HTMLDivElement>(null);
  const btnMembershipTypeRef = useRef<HTMLButtonElement>(null);
  const [membershipDate, setMembershipDate] = useState(new Date());

  const [cardStatus, setCardStatus] = useState(false);
  const [cardStatusOption, setCardStatusOption] = useState("Select one");
  const cardStatusRef = useRef<HTMLDivElement>(null);
  const btnCardStatusRef = useRef<HTMLButtonElement>(null);

  const [kennelsReceived, setKennelsReceived] = useState(false);
  const [kennelsReceivedOption, setKennelsReceivedOption] = useState("Select here");
  const kennelsReceivedRef = useRef<HTMLDivElement>(null);
  const btnKennelsReceivedRef = useRef<HTMLButtonElement>(null);

  //SPECIES
  const handleToggleSpecies = () => {
    setIsSpeciesOpen(!isSpeciesOpen);
  };

  const handleSpeciesOption = (option: SetStateAction<string>) => {
    setSpeciesOption(option);
    setIsSpeciesOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        speciesRef.current &&
        !speciesRef.current.contains(event.target as Node) &&
        btnSpeciesRef.current &&
        !btnSpeciesRef.current.contains(event.target as Node)
      ) {
        setIsSpeciesOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const speciesOptions = ["Dog", "Cat"];

  //SEX
  const handleToggleSex = () => {
    setIsSexOpen(!isSexOpen);
  };

  const handleSexOption = (option: SetStateAction<string>) => {
    setSexOption(option);
    setIsSexOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sexRef.current && !sexRef.current.contains(event.target as Node) && btnSexRef.current && !btnSexRef.current.contains(event.target as Node)) {
        setIsSexOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const sexOptions = ["Male", "Female"];

  //AGE
  const handleToggleAge = () => {
    setIsAgeOpen(!isAgeOpen);
  };

  const handleAgeOption = (option: SetStateAction<string>) => {
    setAgeOption(option);
    setIsAgeOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ageRef.current && !ageRef.current.contains(event.target as Node) && btnAgeRef.current && !btnAgeRef.current.contains(event.target as Node)) {
        setIsAgeOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const ageDogOptions = ["Puppy", "Adult", "Senior"];
  const ageCatOptions = ["Kitten", "Adult", "Senior"];

  const [ageOptions, setAgeOptions] = useState([""]);

  useEffect(() => {
    if (speciesOption == "Cat") {
      setAgeOptions(ageCatOptions);
    } else if (speciesOption == "Dog") {
      setAgeOptions(ageDogOptions);
    }
  }, [speciesOption]);

  //BREED
  const [breedList, setBreedList] = useState<string[]>([]);

  const handleToggleBreed = () => {
    setIsBreedOpen(!isBreedOpen);
  };

  const handleBreedOption = (option: SetStateAction<string>) => {
    setBreedOption(option);
    setIsBreedOpen(false);
    if (!breedList.includes(String(option))) {
      setBreedList([...breedList, String(option)]);
    }
  };

  //const [greaterAreaListOptions, setGreaterAreaListOptions] = useState<GreaterAreaOptions[]>([]);
  const [breedListOptions, setBreedListOptions] = useState<BreedOptions[]>([]);
  const [breedSelection, setBreedSelection] = useState<BreedSelect>();

  const breedDogOptions = [
    "Africanis",
    "Basset",
    "Beagle",
    "Boerboel",
    "Bouvier",
    "Boxer",
    "Bull Terrier",
    "Chihuahua",
    "Chow",
    "Collie",
    "Corgi",
    "Dachshund",
    "Dalmation",
    "Doberman",
    "Fox Terrier",
    "German Shepherd",
    "Husky",
    "Jack Russell",
    "Labrador",
    "Malinois",
    "Maltese Poodle",
    "Pinscher",
    "Pitbull",
    "Ridgeback",
    "Rottweilier",
    "Saint Bernard",
    "Schnauzer",
    "Sharpei",
    "Shepherd",
    "Staffie",
    "Wire Haired Terrier",
    "X-Breed",
    "Not Applicable",
  ];

  const breedCatOptions = ["Not Applicable"];

  const [breedOptions, setBreedOptions] = useState([""]);

  // useEffect(() => {
  //   console.group("Species: ", speciesOption);
  //   console.log("breedOptions before: ", breedOptions);
  //   if (speciesOption == "Cat") {
  //     //setColourOption("Select one");
  //     setBreedOptions(breedCatOptions);
  //     // setColourListOptions(colourCatOptions.map((colour) => ({ colour: colour, state: colourList.includes(colour) })));
  //   } else if (speciesOption == "Dog") {
  //     //setColourOption("Select one");
  //     setBreedOptions(breedDogOptions);
  //     // setColourListOptions(colourDogOptions.map((colour) => ({ colour: colour, state: colourList.includes(colour) })));
  //   }
  //   console.log("breedListOptions after: ", breedListOptions);
  //   console.log("breedOptions after: ", breedOptions);
  // }, [speciesOption, isUpdate, breedList]);

  useEffect(() => {
    //check if any of the breedListOptions are selected
    const selected = breedListOptions.some((breed) => breed.state === true);

    if (speciesOption == "Cat") {
      setBreedOptions(breedCatOptions);
      setBreedListOptions(breedCatOptions.map((breed) => ({ breed: breed, state: false })));
    } else if (speciesOption == "Dog" && !selected) {
      // console.log("Breed Dog Options when changing species: ", breedDogOptions);
      setBreedOptions(breedDogOptions);
      setBreedListOptions(breedDogOptions.map((breed) => ({ breed: breed, state: false })));
    }
  }, [speciesOption]);

  const handleBreed = (option: SetStateAction<string>, state: boolean, selectionCategory: string) => {
    if (selectionCategory === "allSelected") {
      setBreedOption("Select All");
      setBreedSelection({ allSelected: state, clear: false });

      const breeds = breedListOptions.map((breed) => breed.breed);
      setBreedList(breeds);
      //order the roleList in alphabetical order
      // setRoleList(roleList.sort((a, b) => a.localeCompare(b)));
      setBreedListOptions(breedListOptions.map((breed) => ({ ...breed, state: true })));
    } else if (selectionCategory === "clear") {
      setBreedOption("Clear All");
      setBreedSelection({ allSelected: false, clear: state });

      setBreedList([]);
      setBreedListOptions(breedListOptions.map((breed) => ({ ...breed, state: false })));
    } else if (selectionCategory === "normal") {
      setBreedOption(option);
      setBreedSelection({ allSelected: false, clear: false });
      if (state) {
        if (!breedList.includes(String(option))) {
          setBreedList([...breedList, String(option)]);
          //order the roleList in alphabetical order
          // setRoleList(roleList.sort((a, b) => a.localeCompare(b)));
        }

        setBreedListOptions(breedListOptions.map((breed) => (breed.breed === option ? { ...breed, state: true } : breed)));
        // console.log("Greater Area list: ", greaterAreaList);
        // console.log("Greater Area List Options: ", greaterAreaListOptions);
      } else {
        const updatedBreedList = breedList.filter((breed) => breed !== option);
        setBreedList(updatedBreedList);
        //order the roleList in alphabetical order
        // setRoleList(roleList.sort((a, b) => a.localeCompare(b)));
        setBreedListOptions(breedListOptions.map((breed) => (breed.breed === option ? { ...breed, state: false } : breed)));
        // console.log("Greater Area list: ", greaterAreaList);
        // console.log("Greater Area List Options: ", greaterAreaListOptions);
      }
    }

    //console.log("BREED LIST: ", breedList);
  };

  // const handleBreedOption = (option: SetStateAction<string>) => {
  //   setBreedOption(option);
  //   setIsBreedOpen(false);
  // };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (breedRef.current && !breedRef.current.contains(event.target as Node) && btnBreedRef.current && !btnBreedRef.current.contains(event.target as Node)) {
        setIsBreedOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // const breedDogOptions = [
  //   "Africanis",
  //   "Basset",
  //   "Beagle",
  //   "Boerboel",
  //   "Bouvier",
  //   "Boxer",
  //   "Bull Terrier",
  //   "Chihuahua",
  //   "Chow",
  //   "Collie",
  //   "Corgi",
  //   "Dachshund",
  //   "Dalmation",
  //   "Doberman",
  //   "Fox Terrier",
  //   "German Shepherd",
  //   "Husky",
  //   "Jack Russell",
  //   "Labrador",
  //   "Malinois",
  //   "Maltese Poodle",
  //   "Pinscher",
  //   "Pitbull",
  //   "Ridgeback",
  //   "Rottweilier",
  //   "Saint Bernard",
  //   "Schnauzer",
  //   "Sharpei",
  //   "Shepherd",
  //   "Staffie",
  //   "Wire Haired Terrier",
  //   "X-Breed",
  //   "Not Applicable",
  // ];

  // const [breedOptions, setBreedOptions] = useState([""]);

  // useEffect(() => {
  //   if (speciesOption == "Cat") {
  //     setBreedOption("Not Applicable");
  //     setBreedOptions(["Not Applicable"]);
  //   } else if (speciesOption == "Dog") {
  //     //setBreedOption("Select one");
  //     setBreedOptions(breedDogOptions);
  //   }
  // }, [speciesOption]);

  //COLOUR
  const [colourList, setColourList] = useState<string[]>([]);
  const handleToggleColour = () => {
    setIsColourOpen(!isColourOpen);
  };

  const handleColourOption = (option: SetStateAction<string>) => {
    setColourOption(option);
    setIsColourOpen(false);
    if (!colourList.includes(String(option))) {
      setColourList([...colourList, String(option)]);
    }
  };

  //const [greaterAreaListOptions, setGreaterAreaListOptions] = useState<GreaterAreaOptions[]>([]);
  const [colourListOptions, setColourListOptions] = useState<ColourOptions[]>([]);
  const [colourSelection, setColourSelection] = useState<ColourSelect>();

  const colourDogOptions = ["Black", "Brindle", "Brown", "Chocolate Brown", "Grey", "Tan", "White"];

  const colourCatOptions = [
    "Black",
    "Brindle",
    "Brown",
    "Calico (Tri-Colour)",
    "Charcoal",
    "Chocolate Brown",
    "Ginger",
    "Grey",
    "Tabby",
    "Tan",
    "Tortoiseshell",
    "White",
  ];

  const [colourOptions, setColourOptions] = useState([""]);

  useEffect(() => {
    //const selected = colourListOptions.some((colour) => colour.state === true);
    //check if the current colourListOptions has a specific species colours
    const colours = colourListOptions.map((colour) => colour.colour);
    // const catColours = colours.includes((colour) => colour === "Calico (Tri-Colour)");

    //check if the colours are the same as the cat colours
    const catColours = colours.some((colour) => colour == "Calico (Tri-Colour)");
    // console.log("Cat Colours: ", catColours);
    if (speciesOption == "Cat" && !catColours) {
      setColourListOptions(colourCatOptions.map((colour) => ({ colour: colour, state: false })));
    } else if (speciesOption == "Dog" && (catColours || isCreate)) {
      setColourListOptions(colourDogOptions.map((colour) => ({ colour: colour, state: false })));
    }
    // else if (speciesOption == "Dog" && isCreate) {
    //   setColourListOptions(colourDogOptions.map((colour) => ({ colour: colour, state: false })));
    // }
  }, [speciesOption]);

  const handleColour = (option: SetStateAction<string>, state: boolean, selectionCategory: string) => {
    if (selectionCategory === "allSelected") {
      setColourOption("Select All");
      setColourSelection({ allSelected: state, clear: false });

      const colours = colourListOptions.map((colour) => colour.colour);
      setColourList(colours);
      //order the roleList in alphabetical order
      // setRoleList(roleList.sort((a, b) => a.localeCompare(b)));
      setColourListOptions(colourListOptions.map((colour) => ({ ...colour, state: true })));
    } else if (selectionCategory === "clear") {
      setColourOption("Clear All");
      setColourSelection({ allSelected: false, clear: state });

      setColourList([]);
      setColourListOptions(colourListOptions.map((colour) => ({ ...colour, state: false })));
    } else if (selectionCategory === "normal") {
      setColourOption(option);
      setColourSelection({ allSelected: false, clear: false });
      if (state) {
        if (!colourList.includes(String(option))) {
          setColourList([...colourList, String(option)]);
          //order the roleList in alphabetical order
          // setRoleList(roleList.sort((a, b) => a.localeCompare(b)));
        }

        setColourListOptions(colourListOptions.map((colour) => (colour.colour === option ? { ...colour, state: true } : colour)));
        // console.log("Greater Area list: ", greaterAreaList);
        // console.log("Greater Area List Options: ", greaterAreaListOptions);
      } else {
        const updatedColourList = colourList.filter((colour) => colour !== option);
        setColourList(updatedColourList);
        //order the roleList in alphabetical order
        // setRoleList(roleList.sort((a, b) => a.localeCompare(b)));
        setColourListOptions(colourListOptions.map((colour) => (colour.colour === option ? { ...colour, state: false } : colour)));
        // console.log("Greater Area list: ", greaterAreaList);
        // console.log("Greater Area List Options: ", greaterAreaListOptions);
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        colourRef.current &&
        !colourRef.current.contains(event.target as Node) &&
        btnColourRef.current &&
        !btnColourRef.current.contains(event.target as Node)
      ) {
        setIsColourOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  //show all the clinics that the volunteer attended
  const [showColour, setShowColour] = useState(false);
  const handleShowColour = () => {
    setShowColour(!showColour);
  };

  //SIZE
  const handleToggleSize = () => {
    setSize(!size);
  };

  const handleSizeOption = (option: SetStateAction<string>) => {
    setSizeOption(option);
    setSize(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sizeRef.current && !sizeRef.current.contains(event.target as Node) && btnSizeRef.current && !btnSizeRef.current.contains(event.target as Node)) {
        setSize(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const sizeOptions = ["Small", "Medium", "Large"];

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

  const statusOptions = [
    "Active",
    "Deceased",
    "Given away",
    "Lost",
    "Moved",
    "No reason",
    "Poisoned",
    "Ran away",
    "Re-homed",
    "Shot",
    "Sold",
    "Stolen",
    "Surrendered",
    "Taken by SPCA",
    "TEARS",
  ];

  //STERILISATION STATUS
  const handleToggleSterilisationStatus = () => {
    setSterilisationStatus(!sterilisationStatus);
  };

  const handleSterilisationStatusOption = (option: SetStateAction<string>) => {
    setSterilisationStatusOption(option);
    setSterilisationStatus(false);

    if (option === "Yes") {
      setSterilisationRequestSignedOption("Select one");
      setSterilisationRequestedOption("Select one");
      setSterilisationOutcomeOption("Select one");
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sterilisationStatusRef.current &&
        !sterilisationStatusRef.current.contains(event.target as Node) &&
        btnSterilisationStatusRef.current &&
        !btnSterilisationStatusRef.current.contains(event.target as Node)
      ) {
        setSterilisationStatus(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const sterilisationStatusOptions = ["Yes", "No"];

  interface CustomInput {
    value?: string;
    onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  }

  // CustomInput component with explicit types for the props
  const CustomSterilisationStatusInput: React.FC<CustomInput> = ({ value, onClick }) => (
    <button className="form-input z-0 flex items-center rounded-md border px-1 py-2" onClick={onClick}>
      <svg className=" mr-2 h-4 w-4 text-gray-500 " aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
        <path d="M20 4a2 2 0 0 0-2-2h-2V1a1 1 0 0 0-2 0v1h-3V1a1 1 0 0 0-2 0v1H6V1a1 1 0 0 0-2 0v1H2a2 2 0 0 0-2 2v2h20V4ZM0 18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8H0v10Zm5-8h10a1 1 0 0 1 0 2H5a1 1 0 0 1 0-2Z" />
      </svg>
      <div className="m-1 mr-2">(Select here): </div>
      {isUpdate
        ? sterilisationStatusDate.getDate().toString() +
          "/" +
          (sterilisationStatusDate.getMonth() + 1).toString() +
          "/" +
          sterilisationStatusDate.getFullYear().toString()
        : value}
    </button>
  );

  //if sterilisation outcome is actioned the sterilisation yes
  useEffect(() => {
    if (sterilisationOutcomeOption === "Actioned") {
      setSterilisationStatusOption("Yes");
      setSterilisationStatusDate(new Date());
    }
  }, [sterilisationOutcomeOption]);

  //STERILISATION REQUESTED
  const handleToggleSterilisationRequested = () => {
    setSterilisationRequested(!sterilisationRequested);
  };

  const handleSterilisationRequestedOption = (option: SetStateAction<string>) => {
    setSterilisationRequestedOption(option);
    setSterilisationRequested(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sterilisationRequestedRef.current &&
        !sterilisationRequestedRef.current.contains(event.target as Node) &&
        btnSterilisationRequestedRef.current &&
        !btnSterilisationRequestedRef.current.contains(event.target as Node)
      ) {
        setSterilisationRequested(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const sterilisationRequestedOptions = ["Yes", "No"];

  useEffect(() => {
    if (sterilisationRequestedOption === "Yes") {
      setSterilisationRequestedDate(new Date());
    }
  }, [sterilisationRequestedOption]);

  //if sterilisation status is No
  useEffect(() => {
    if (sterilisationStatusOption === "No" && sterilisationRequestedOption === "") {
      setSterilisationRequestedOption("Select one");
    }
  }, [sterilisationStatusOption]);

  //STERILISATION REQUEST SIGNED
  const handleToggleSterilisationRequestSigned = () => {
    setSterilisationRequestSigned(!sterilisationRequestSigned);
  };

  const handleSterilisationRequestSignedOption = (option: SetStateAction<string>) => {
    setSterilisationRequestSignedOption(option);
    setSterilisationRequestSigned(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sterilisationRequestSignedRef.current &&
        !sterilisationRequestSignedRef.current.contains(event.target as Node) &&
        btnSterilisationRequestSignedRef.current &&
        !btnSterilisationRequestSignedRef.current.contains(event.target as Node)
      ) {
        setSterilisationRequestSigned(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const sterilisationRequestConfirmedSignedOptions = ["Registration Desk", "Field Hospital", "Vaccination Station", "Outside of Pet Clinic", "Not Applicable"];
  const [sterilisationRequestSignedOptions, setSterilisationRequestSignedOptions] = useState([""]);

  useEffect(() => {
    if (sterilisationRequestedOption === "No") {
      setSterilisationRequestSignedOption("Not Applicable");
      setSterilisationRequestSignedOptions(["Not Applicable"]);
    } else if (sterilisationRequestedOption === "Yes") {
      if (sterilisationRequestSignedOption === "" || sterilisationRequestSignedOption === undefined) {
        setSterilisationRequestSignedOption("Select one");
      }
      setSterilisationRequestSignedOptions(sterilisationRequestConfirmedSignedOptions);
    }
  }, [sterilisationRequestedOption]); // Add dependencies here

  interface CustomInput {
    value?: string;
    onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  }

  // CustomInput component with explicit types for the props
  const CustomSterilisationRequestedInput: React.FC<CustomInput> = ({ value, onClick }) => (
    <button className="form-input flex items-center rounded-md border px-1 py-2" onClick={onClick}>
      <svg className="z-10 mr-2 h-4 w-4 text-gray-500 " aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
        <path d="M20 4a2 2 0 0 0-2-2h-2V1a1 1 0 0 0-2 0v1h-3V1a1 1 0 0 0-2 0v1H6V1a1 1 0 0 0-2 0v1H2a2 2 0 0 0-2 2v2h20V4ZM0 18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8H0v10Zm5-8h10a1 1 0 0 1 0 2H5a1 1 0 0 1 0-2Z" />
      </svg>
      <div className="m-1 mr-2">(Select here): </div>
      {isUpdate
        ? sterilisationRequestedDate.getDate().toString() +
          "/" +
          (sterilisationRequestedDate.getMonth() + 1).toString() +
          "/" +
          sterilisationRequestedDate.getFullYear().toString()
        : value}
    </button>
  );

  //STERILISATION OUTCOME
  const handleToggleSterilisationOutcome = () => {
    setSterilisationOutcome(!sterilisationOutcome);
  };

  const handleSterilisationOutcomeOption = (option: SetStateAction<string>) => {
    setSterilisationOutcomeOption(option);
    setSterilisationOutcome(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sterilisationOutcomeRef.current &&
        !sterilisationOutcomeRef.current.contains(event.target as Node) &&
        btnSterilisationOutcomeRef.current &&
        !btnSterilisationOutcomeRef.current.contains(event.target as Node)
      ) {
        setSterilisationOutcome(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const sterilisationOutcomeOptions = ["Actioned", "No Show"];

  //Sterilisation Outcome Date
  //const [sterilisationOutcomeDate, setSterilisationOutcomeDate] = useState(new Date());
  // CustomInput component with explicit types for the props
  const CustomSterilisationOutcomeInput: React.FC<CustomInput> = ({ value, onClick }) => (
    <button className="form-input z-0 flex items-center rounded-md border px-1 py-2" onClick={onClick}>
      <svg className=" mr-2 h-4 w-4 text-gray-500 " aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
        <path d="M20 4a2 2 0 0 0-2-2h-2V1a1 1 0 0 0-2 0v1h-3V1a1 1 0 0 0-2 0v1H6V1a1 1 0 0 0-2 0v1H2a2 2 0 0 0-2 2v2h20V4ZM0 18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8H0v10Zm5-8h10a1 1 0 0 1 0 2H5a1 1 0 0 1 0-2Z" />
      </svg>
      <div className="m-1 mr-2">(Select here): </div>
      {isUpdate
        ? sterilisationOutcomeDate.getDate().toString() +
          "/" +
          (sterilisationOutcomeDate.getMonth() + 1).toString() +
          "/" +
          sterilisationOutcomeDate.getFullYear().toString()
        : value}
    </button>
  );

  //if sterilisation requested option is Yes and sterilisationRequestSigned != ""
  useEffect(() => {
    if (sterilisationRequestedOption === "Yes" && sterilisationRequestSignedOption != "" && sterilisationOutcomeOption === "") {
      setSterilisationOutcomeOption("Select one");
    }
  }, [sterilisationRequestedOption, sterilisationRequestSignedOption]);

  //VACCINATION SHOT 1
  const handleToggleVaccinationShot1 = () => {
    setVaccinationShot1(!vaccinationShot1);
  };

  const handleVaccinationShot1Option = (option: SetStateAction<string>) => {
    setVaccinationShot1Option(option);
    setVaccinationShot1(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        vaccinationShot1Ref.current &&
        !vaccinationShot1Ref.current.contains(event.target as Node) &&
        btnVaccinationShot1Ref.current &&
        !btnVaccinationShot1Ref.current.contains(event.target as Node)
      ) {
        setVaccinationShot1(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const vaccinationShot1Options = ["Yes", "Not yet"];

  interface CustomInputProps {
    value?: string;
    onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  }

  // CustomInput component with explicit types for the props
  const CustomVaccine1Input: React.FC<CustomInputProps> = ({ value, onClick }) => (
    <button className="form-input z-0 flex items-center rounded-md border px-1 py-2" onClick={onClick}>
      <svg className=" mr-2 h-4 w-4 text-gray-500 " aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
        <path d="M20 4a2 2 0 0 0-2-2h-2V1a1 1 0 0 0-2 0v1h-3V1a1 1 0 0 0-2 0v1H6V1a1 1 0 0 0-2 0v1H2a2 2 0 0 0-2 2v2h20V4ZM0 18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8H0v10Zm5-8h10a1 1 0 0 1 0 2H5a1 1 0 0 1 0-2Z" />
      </svg>
      <div className="m-1 mr-2">(Select here): </div>
      {isUpdate
        ? vaccinationShot1Date.getDate().toString() +
          "/" +
          (vaccinationShot1Date.getMonth() + 1).toString() +
          "/" +
          vaccinationShot1Date.getFullYear().toString()
        : value}
    </button>
  );

  useEffect(() => {
    if (vaccinationShot1Option == "") {
      // console.log("Hellooooo, Vaccination shot 1: ", vaccinationShot1Option);
      setVaccinationShot1Option("Select one");
    }
    if (vaccinationShot2Option == "") {
      setVaccinationShot2Option("Select one");
    }
    if (vaccinationShot3Option == "") {
      setVaccinationShot3Option("Select one");
    }
  }, [isUpdate, isCreate, isViewProfilePage]);

  //VACCINATION SHOT 2
  const handleToggleVaccinationShot2 = () => {
    setVaccinationShot2(!vaccinationShot2);
  };

  const handleVaccinationShot2Option = (option: SetStateAction<string>) => {
    setVaccinationShot2Option(option);
    setVaccinationShot2(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        vaccinationShot2Ref.current &&
        !vaccinationShot2Ref.current.contains(event.target as Node) &&
        btnVaccinationShot2Ref.current &&
        !btnVaccinationShot2Ref.current.contains(event.target as Node)
      ) {
        setVaccinationShot2(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const vaccinationShot2Options = ["Yes", "Not yet"];

  interface CustomInputProps {
    value?: string;
    onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  }

  // CustomInput component with explicit types for the props
  const CustomVaccine2Input: React.FC<CustomInputProps> = ({ value, onClick }) => (
    <button className="form-input flex items-center rounded-md border px-1 py-2" onClick={onClick}>
      <svg className="z-10 mr-2 h-4 w-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
        <path d="M20 4a2 2 0 0 0-2-2h-2V1a1 1 0 0 0-2 0v1h-3V1a1 1 0 0 0-2 0v1H6V1a1 1 0 0 0-2 0v1H2a2 2 0 0 0-2 2v2h20V4ZM0 18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8H0v10Zm5-8h10a1 1 0 0 1 0 2H5a1 1 0 0 1 0-2Z" />
      </svg>
      <div className="m-1 mr-2">(Select here): </div>
      {isUpdate
        ? vaccinationShot2Date.getDate().toString() +
          "/" +
          (vaccinationShot2Date.getMonth() + 1).toString() +
          "/" +
          vaccinationShot2Date.getFullYear().toString()
        : value}
    </button>
  );

  // useEffect(() => {
  //   if (vaccinationShot2Option === "Yes") {
  //     setVaccinationShot2Date(new Date());
  //   }
  // }, [vaccinationShot2Option]);

  //VACCINATION SHOT 3
  const handleToggleVaccinationShot3 = () => {
    setVaccinationShot3(!vaccinationShot3);
  };

  const handleVaccinationShot3Option = (option: SetStateAction<string>) => {
    setVaccinationShot3Option(option);
    setVaccinationShot3(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        vaccinationShot3Ref.current &&
        !vaccinationShot3Ref.current.contains(event.target as Node) &&
        btnVaccinationShot3Ref.current &&
        !btnVaccinationShot3Ref.current.contains(event.target as Node)
      ) {
        setVaccinationShot3(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const vaccinationShot3Options = ["Yes", "Not yet"];

  interface CustomInputProps {
    value?: string;
    onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  }

  // CustomInput component with explicit types for the props
  const CustomVaccine3Input: React.FC<CustomInputProps> = ({ value, onClick }) => (
    <button className="form-input flex items-center rounded-md border px-1 py-2" onClick={onClick}>
      <svg className="z-10 mr-2 h-4 w-4 text-gray-500 " aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
        <path d="M20 4a2 2 0 0 0-2-2h-2V1a1 1 0 0 0-2 0v1h-3V1a1 1 0 0 0-2 0v1H6V1a1 1 0 0 0-2 0v1H2a2 2 0 0 0-2 2v2h20V4ZM0 18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8H0v10Zm5-8h10a1 1 0 0 1 0 2H5a1 1 0 0 1 0-2Z" />
      </svg>
      <div className="m-1 mr-2">(Select here): </div>
      {isUpdate
        ? vaccinationShot3Date.getDate().toString() +
          "/" +
          (vaccinationShot3Date.getMonth() + 1).toString() +
          "/" +
          vaccinationShot3Date.getFullYear().toString()
        : value}
    </button>
  );

  // useEffect(() => {
  //   if (vaccinationShot3Option === "Yes") {
  //     setVaccinationShot3Date(new Date());
  //   }
  // }, [vaccinationShot3Option]);

  //MEMBERSHIP TYPE
  const handleToggleMembershipType = () => {
    setMembershipType(!membershipType);
  };

  const handleMembershipTypeOption = (option: SetStateAction<string>) => {
    setMembershipTypeOption(option);
    setMembershipType(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        membershipTypeRef.current &&
        !membershipTypeRef.current.contains(event.target as Node) &&
        btnMembershipTypeRef.current &&
        !btnMembershipTypeRef.current.contains(event.target as Node)
      ) {
        setMembershipType(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const membershipTypeOptions = ["Non-card Holder", "Standard Card Holder", "Gold Card Holder"];

  const qualifiesWithAttendance = (time: number): boolean => {
    const currentDate = new Date();

    // Convert clinicList dates to Date objects
    const clinicDates = clinicList.map((clinicDate) => {
      const [day, month, year] = clinicDate.date.split("/").map(Number);
      return new Date(year ?? 0, (month ?? 0) - 1, day);
    });

    // Filter clinics within the last 'time' months
    const filteredClinics = clinicDates.filter((clinicDate) => {
      const pastDate = new Date(currentDate);
      pastDate.setMonth(currentDate.getMonth() - time);
      return clinicDate >= pastDate;
    });

    if (time === 6) {
      return filteredClinics.length >= 5;
    } else if (time === 24) {
      return filteredClinics.length >= 18;
    } else {
      return false;
    }
  };

  //Membership from non to standard card holder
  useEffect(() => {
    // console.log("Helllo this is Membership Type: ", membershipTypeOption);
    // console.log("Helllo this is Sterilisation Status: ", sterilisationStatusOption);
    // console.log("Helllo this is Clinic List: ", clinicList);
    // console.log("Helllo this is Qualifies with attendance: ", qualifiesWithAttendance(6));
    if (
      qualifiesWithAttendance(6) &&
      (membershipTypeOption === "Non-card Holder" || membershipTypeOption === "Non-card holder") &&
      sterilisationStatusOption === "Yes"
    ) {
      // console.log("Yesss we are changing it to standard card holder");
      setMembershipTypeOption("Standard Card Holder");
    }
  }, [clinicList, sterilisationStatusOption]);

  //Checks if card status of membership is lapsed or active
  const membershipStatus = (): string => {
    if (
      membershipTypeOption === "Standard Card Holder" ||
      membershipTypeOption === "Standard card holder" ||
      membershipTypeOption === "Gold Card Holder" ||
      membershipTypeOption === "Gold card holder"
    ) {
      const currentDate = new Date();

      // Convert clinicList dates to Date objects
      const clinicDates = clinicList.map((clinicDate) => {
        const [day, month, year] = clinicDate.date.split("/").map(Number);
        return new Date(year ?? 0, (month ?? 0) - 1, day);
      });

      // Filter clinics within the last 'time' months
      const filteredClinicsLapsedMember = clinicDates.filter((clinicDate) => {
        const pastDate = new Date(currentDate);
        pastDate.setMonth(currentDate.getMonth() - 3);
        return clinicDate >= pastDate;
      });

      const filteredClinicsActiveMember = clinicDates.filter((clinicDate) => {
        const pastDate = new Date(currentDate);
        pastDate.setMonth(currentDate.getMonth() - 6);
        return clinicDate >= pastDate;
      });

      if (filteredClinicsLapsedMember.length < 1) {
        //setCardStatusOption("Lapsed card holder");
        return "(Lapsed)";
      } else if (filteredClinicsActiveMember.length >= 3) {
        return "(Active)";
      } else {
        return "";
      }
    } else {
      return "";
    }
  };

  // Example Usage
  // console.log(qualifiesWithAttendance(6)); // Check for standard card
  // console.log(qualifiesWithAttendance(24)); // Check for gold card

  //checks to see what membership message should be displayed
  const membershipMessage = (membership: string): string => {
    if (
      (membership == "Non-card Holder" || membership == "Non-card holder" || cardStatusOption == "Lapsed card holder") &&
      sterilisationStatusOption === "Yes" &&
      qualifiesWithAttendance(6)
    ) {
      return "Qualifies For Standard Card";
    } else if (membership == "Standard card holder" && sterilisationStatusOption === "Yes" && qualifiesWithAttendance(24)) {
      return "Qualifies For Gold Card";
    } else {
      return "";
    }
  };

  //Membership date
  const CustomMembershipInput: React.FC<CustomInput> = ({ value, onClick }) => (
    <button className="form-input z-0 flex items-center rounded-md border px-1 py-2" onClick={onClick}>
      <svg className=" mr-2 h-4 w-4 text-gray-500 " aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
        <path d="M20 4a2 2 0 0 0-2-2h-2V1a1 1 0 0 0-2 0v1h-3V1a1 1 0 0 0-2 0v1H6V1a1 1 0 0 0-2 0v1H2a2 2 0 0 0-2 2v2h20V4ZM0 18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8H0v10Zm5-8h10a1 1 0 0 1 0 2H5a1 1 0 0 1 0-2Z" />
      </svg>
      <div className="m-1 mr-2">(Select here): </div>
      {isUpdate
        ? membershipDate.getDate().toString() + "/" + (membershipDate.getMonth() + 1).toString() + "/" + membershipDate.getFullYear().toString()
        : value}
    </button>
  );

  //CARD STATUS
  const handleToggleCardStatus = () => {
    setCardStatus(!cardStatus);
  };

  const handleCardStatusOption = (option: SetStateAction<string>) => {
    setCardStatusOption(option);
    setCardStatus(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        cardStatusRef.current &&
        !cardStatusRef.current.contains(event.target as Node) &&
        btnCardStatusRef.current &&
        !btnCardStatusRef.current.contains(event.target as Node)
      ) {
        setCardStatus(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const cardStatusOptions = membershipTypeOption == "Non-card Holder" ? ["Not Applicable"] : ["Not Applicable", "Collect", "Issued", "Re-print"];

  useEffect(() => {
    if (membershipTypeOption != "Select one" && cardStatusOption == "") {
      setCardStatusOption("Select one");
    }
  }, [membershipTypeOption]);

  // useEffect(() => {
  //   if (membershipStatus() === "(Lapsed)" && cardStatusOption !== "Lapsed card holder") {
  //     setCardStatusOption("Lapsed card holder");
  //   } else if (membershipStatus() === "(Active)" && cardStatusOption === "Lapsed card holder") {
  //     setCardStatusOption("Select one");
  //   }
  // }, [membershipStatus, clinicList]);

  //VET FEES
  const VetFees = (): string => {
    if (membershipStatus() === "(Active)" && membershipTypeOption !== "Non-card Holder") {
      return "Yes";
    }
    return "No";
  };

  //KENNELS RECEIVED

  const [kennelListOptions, setKennelListOptions] = useState<KennelOptions[]>([]);
  const [kennelSelection, setKennelSelection] = useState<KennelSelect>();
  //to select multiple kennels
  const [kennelList, setKennelList] = useState<string[]>([]);

  const handleKennel = (option: SetStateAction<string>, state: boolean, selectionCategory: string) => {
    if (selectionCategory === "allSelected") {
      setKennelsReceivedOption("Select All");
      setKennelSelection({ allSelected: state, clear: false });

      const kennels = kennelListOptions.map((kennel) => kennel.year);
      setKennelList(kennels);
      //order the roleList in alphabetical order
      // setRoleList(roleList.sort((a, b) => a.localeCompare(b)));
      setKennelListOptions(kennelListOptions.map((kennel) => ({ ...kennel, state: true })));
    } else if (selectionCategory === "clear") {
      setKennelsReceivedOption("Clear All");
      setKennelSelection({ allSelected: false, clear: state });

      setKennelList([]);
      setKennelListOptions(kennelListOptions.map((kennel) => ({ ...kennel, state: false })));
    } else if (selectionCategory === "normal") {
      setKennelsReceivedOption(option);
      setKennelSelection({ allSelected: false, clear: false });
      if (state) {
        if (!kennelList.includes(String(option))) {
          setKennelList([...kennelList, String(option)]);
          //order the roleList in alphabetical order
          // setRoleList(roleList.sort((a, b) => a.localeCompare(b)));
        }

        setKennelListOptions(kennelListOptions.map((kennel) => (kennel.year === option ? { ...kennel, state: true } : kennel)));
        // console.log("Greater Area list: ", greaterAreaList);
        // console.log("Greater Area List Options: ", greaterAreaListOptions);
      } else {
        const updatedKennelList = kennelList.filter((kennel) => kennel !== option);
        setKennelList(updatedKennelList);
        //order the roleList in alphabetical order
        // setRoleList(roleList.sort((a, b) => a.localeCompare(b)));
        setKennelListOptions(kennelListOptions.map((kennel) => (kennel.year === option ? { ...kennel, state: false } : kennel)));
        // console.log("Greater Area list: ", greaterAreaList);
        // console.log("Greater Area List Options: ", greaterAreaListOptions);
      }
    }
  };
  // const [kennelList, setKennelList] = useState<string[]>([]);
  //show all available options
  const kennelsReceivedOptions = [
    "No kennels received",
    "Kennel received in 2018",
    "Kennel received in 2019",
    "Kennel received in 2020",
    "Kennel received in 2021",
    "Kennel received in 2022",
    "Kennel received in 2023",
    "Kennel received in 2024",
  ];

  const handleToggleKennelsReceived = () => {
    setKennelsReceived(!kennelsReceived);
  };

  const handleKennelsReceivedOption = (option: SetStateAction<string>) => {
    setKennelsReceivedOption(option);
    setKennelsReceived(false);
    if (!kennelList.includes(String(option))) {
      setKennelList([...kennelList, String(option)]);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        kennelsReceivedRef.current &&
        !kennelsReceivedRef.current.contains(event.target as Node) &&
        btnKennelsReceivedRef.current &&
        !btnKennelsReceivedRef.current.contains(event.target as Node)
      ) {
        setKennelsReceived(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  //show all the clinics that the volunteer attended
  const [showKennelsReceived, setShowKennelsReceived] = useState(false);
  const handleShowKennelsReceived = () => {
    setShowKennelsReceived(!showKennelsReceived);
  };

  useEffect(() => {
    const sortedYears = [...kennelList].sort((a, b) => parseInt(a) - parseInt(b));
    setKennelList(sortedYears);
  }, [kennelsReceived]);

  //Qualify for kennel
  const qualifiesForKennel = (): string => {
    const currentDate = new Date();
    const clinicDates = clinicList.map((clinicDate) => {
      const [day, month, year] = clinicDate.date.split("/").map(Number);
      return new Date(year ?? 0, (month ?? 0) - 1, day);
    });

    // Filter clinics within the last 12 months
    const filteredClinics = clinicDates.filter((clinicDate) => {
      const pastDate = new Date(currentDate);
      pastDate.setMonth(currentDate.getMonth() - 12);
      return clinicDate >= pastDate;
    });

    const receivedKennelInLast3Years = kennelList.some((year) => {
      const pastDate = new Date(currentDate);
      pastDate.setFullYear(currentDate.getFullYear() - 3);
      return parseInt(year.slice(19, 23)) >= pastDate.getFullYear();
    });

    //console.log("receivedKennelInLast3Years!!!!: ", receivedKennelInLast3Years);
    if (membershipTypeOption !== "Non-card Holder" && filteredClinics.length >= 9 && !receivedKennelInLast3Years) {
      return "Yes";
    } else {
      return "No";
    }
  };

  //qualifies for a kennel message
  // const kennelMessage = (kennels: string[]): string => {
  //   if (kennels.length === 0 && membershipTypeOption == "Gold card holder") {
  //     return "(Qualifies for kennel)";
  //   } else {
  //     return "";
  //   }
  // };

  //CLINICSATTENDED
  const [clinicListOptions, setClinicListOptions] = useState<ClinicOptions[]>([]);
  const [clinicSelection, setClinicSelection] = useState<ClinicSelect>();
  const [showClinicMessage, setShowClinicMessage] = useState(false);
  //All clinics in petClinic table
  const clinicsAttendedOptions = api.petClinic.getAllClinics.useQuery(undefined, { enabled: hasAccess }).data ?? [];

  // const clinicsAttendedOptions = ["Clinic 1", "Clinic 2", "Clinic 3"];
  const [clinicsAttended, setClinicsAttended] = useState(false);
  const [clinicsAttendedOption, setClinicsAttendedOption] = useState("Select here");
  const clinicsAttendedRef = useRef<HTMLDivElement>(null);
  const btnClinicsAttendedRef = useRef<HTMLButtonElement>(null);

  const handleToggleClinicsAttended = () => {
    setClinicsAttended(!clinicsAttended);
  };

  // Custom comparison function for date strings
  const compareDates = (a: string, b: string) => {
    const [dayA, monthA, yearA] = a.split("/")?.map(Number) ?? [0, 0, 0];
    const [dayB, monthB, yearB]: number[] = b.split("/").map(Number);

    // Compare by year, then by month, then by day
    if ((yearA ?? 0) !== (yearB ?? 0)) return (yearB ?? 0) - (yearA ?? 0);
    if (monthA !== monthB) return (monthB ?? 0) - (monthA ?? 0);
    return (dayB ?? 0) - (dayA ?? 0);
  };

  const handleClinicsAttended = (id: number, area: SetStateAction<string>, date: SetStateAction<string>, state: boolean, selectionCategory: string) => {
    if (selectionCategory === "allSelected") {
      setClinicsAttendedOption("Select All");
      setClinicSelection({ allSelected: state, clear: false });

      const clinics = clinicListOptions.map((clinic) => ({
        id: clinic.id,
        date: clinic.date,
        area: clinic.area,
      }));

      // console.log("Clinics!!!!: ", clinics);
      setClinicList(clinics);
      //order the greaterAreaList from smallest to largest id
      //setClinicList(clinicList.sort((a, b) => a.id - b.id));
      setClinicListOptions(clinicListOptions.map((clinic) => ({ ...clinic, state: true })));
    } else if (selectionCategory === "clear") {
      setClinicsAttendedOption("Clear All");
      setClinicSelection({ allSelected: false, clear: state });

      setClinicList([]);
      setClinicListOptions(clinicListOptions.map((clinic) => ({ ...clinic, state: false })));
    } else if (selectionCategory === "normal") {
      setClinicsAttendedOption(date);
      setClinicSelection({ allSelected: false, clear: false });
      if (state) {
        const clinic: Clinic = {
          id: id,
          date: String(date),
          area: String(area),
        };
        const clinicIDList = clinicList.map((clinic) => clinic.id);
        if (!clinicIDList.includes(id)) {
          setClinicList([...clinicList, clinic]);

          //order the greaterAreaList from smallest to largest id
          // console.log(
          //   "Sorted Greater Areas!!!: ",
          //   greaterAreaList.sort((a, b) => a.id - b.id),
          // );
          // setGreaterAreaList(greaterAreaList.sort((a, b) => a.id - b.id));
        }
        setClinicListOptions(clinicListOptions.map((clinic) => (clinic.id === id ? { ...clinic, state: true } : clinic)));

        // console.log("Greater Area list: ", greaterAreaList);
        // console.log("Greater Area List Options: ", greaterAreaListOptions);
      } else {
        const updatedClinicList = clinicList.filter((clinic) => clinic.id !== id);
        // setClinicList(updatedClinicList);

        //order the greaterAreaList from smallest to largest id
        setClinicList(updatedClinicList.sort((a, b) => a.id - b.id));
        setClinicListOptions(clinicListOptions.map((clinic) => (clinic.id === id ? { ...clinic, state: false } : clinic)));
        // console.log("Greater Area list: ", greaterAreaList);
        // console.log("Greater Area List Options: ", greaterAreaListOptions);
      }
    }
  };

  const handleClinicsAttendedOption = (optionID: number, option: SetStateAction<string>, optionArea: string) => {
    setClinicsAttended(false);
    setShowClinicsAttended(false);
    setClinicsAttendedOption(option);

    const clinic: Clinic = {
      id: optionID,
      date: String(option),
      area: optionArea,
    };
    const clinicIDList = clinicList.map((clinic) => clinic.id);

    if (!clinicIDList.includes(optionID)) {
      setClinicList([...clinicList, clinic]);
      // setClinicIDList([...clinicIDList, optionID]);
    }
  };

  // useEffect(() => {
  //   //order the clinicList so that it is from the first date to the last date

  //   // Sort the list in ascending order (from first date to last date)
  //   const updatedClinicList = [...clinicList].sort(compareDates);

  //   console.log("Updated list", updatedClinicList);
  //   // Update the clinicList state
  //   setClinicList(updatedClinicList);
  // }, [clinicsAttended]);

  useEffect(() => {
    setClinicList(clinicList.sort((a, b) => compareDates(a.date, b.date)));

    // // Combine clinic names and their IDs into a single array
    // const combinedClinicList = clinicList.map((clinic) => ({
    //   name: clinic.date,
    //   id: clinic.id,
    // }));

    // // Sort the combined array based on the clinic names (dates)
    // combinedClinicList.sort((a, b) => compareDates(a.name, b.name));

    // // Separate the sorted clinic names and IDs back into their respective arrays
    // const sortedClinicList = combinedClinicList.map((item) => item.name);
    // const sortedClinicIDList = combinedClinicList.map((item) => item.id);

    // // Update the states
    // setClinicList(sortedClinicList);
    // setClinicIDList(sortedClinicIDList.filter((id) => id !== undefined) as number[]);

    // console.log("Sorted clinic list", sortedClinicList);
    // console.log("Sorted clinic ID list", sortedClinicIDList);
  }, [clinicsAttended]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        clinicsAttendedRef.current &&
        !clinicsAttendedRef.current.contains(event.target as Node) &&
        btnClinicsAttendedRef.current &&
        !btnClinicsAttendedRef.current.contains(event.target as Node)
      ) {
        setClinicsAttended(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  //show all the clinics that the volunteer attended
  const [showClinicsAttended, setShowClinicsAttended] = useState(false);
  const handleShowClinicsAttended = () => {
    setShowClinicsAttended(!showClinicsAttended);
  };

  //Show clinic message
  useEffect(() => {
    //get the first 3 clinics
    const lastThreeClinics = clinicsAttendedOptions.slice(0, 3);
    // console.log("Last three clinics", lastThreeClinics);

    //last three clinic ids
    const lastThreeClinicIDs = lastThreeClinics.map((clinic) => clinic?.clinicID);

    for (const clinic of clinicList) {
      if (lastThreeClinicIDs.includes(clinic.id)) {
        setShowClinicMessage(true);
        return;
        // console.log("In the last 3: ", showClinicMessage);
      } else {
        setShowClinicMessage(false);
        //  console.log("No last 3: ", showClinicMessage);
      }
    }

    // clinicList.map((clinic) => {
    //   console.log("ClinicID: ", clinic.id);
    //   console.log("Last 3: ", lastThreeClinics[0]?.clinicID, lastThreeClinics[1]?.clinicID, lastThreeClinics[2]?.clinicID);
    //   if (
    //     (lastThreeClinics[0]?.clinicID === clinic.id || lastThreeClinics[1]?.clinicID === clinic.id || lastThreeClinics[2]?.clinicID === clinic.id) &&
    //     clinicList.length > 0
    //   ) {
    //     setShowClinicMessage(true);
    //     console.log("In the last 3", showClinicMessage);
    //   } else {
    //     setShowClinicMessage(false);
    //     console.log("No last 3", showClinicMessage);
    //   }
    // });
    // console.log("ClinicList", clinicList);
    //  console.log("Show clinic message", showClinicMessage);
  }, [clinicList, isViewProfilePage]);

  //LAST DEWORMING
  //take the last date of the clinics that were attended and set as default for last deworming
  //const lastClinic = clinicList[clinicList.length - 1];
  //const lastClinicDate = lastClinic?.split("/").map(Number);
  const [lastDeworming, setLastDeworming] = useState(new Date());
  // useEffect(() => {
  //   const dateString = clinicDates[0] ?? "";
  //   // const [day, month, year] = dateString.split("/");
  //   // const formattedDate = `${year}-${month}-${day}`;
  //   // setLastDeworming(new Date(formattedDate));
  //   const [day, month, year] = dateString.split("/").map((part) => parseInt(part, 10));
  //   if (!Number.isNaN(day) && !Number.isNaN(month) && !Number.isNaN(year)) {
  //     // JavaScript's Date month is 0-indexed, so subtract 1 from the month.
  //     const dateObject = new Date(year ?? 0, (month ?? 0) - 1, day ?? 0);
  //     setLastDeworming(dateObject);
  //     console.log("Last deworming", dateObject);
  //   }
  // }, []);

  //checks if deworming was more than 3 months ago if cat and 6 months ago if dog
  const isMoreThanSixMonthsAgo = (date: Date): boolean => {
    const sixMonthsAgo = new Date();
    if (speciesOption === "Cat") {
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 3);
    } else {
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    }

    return date < sixMonthsAgo;
  };

  interface CustomInputProps {
    value?: string;
    onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  }

  const formatDate = (dateStr: string) => {
    // const day = dateStr.split("/")[1];
    // const month = dateStr.split("/")[0];
    // const year = dateStr.split("/")[2];
    // return `${day}/${month}/${year}`;

    const date = new Date(dateStr);
    // console.log(date);
    return `${date.getDate().toString()}/${(date.getMonth() ?? 0 + 1).toString()}/${date.getFullYear()}`;
  };

  // CustomInput component with explicit types for the props
  const CustomInput: React.FC<CustomInputProps> = ({ value, onClick }) => (
    <button className="form-input flex items-center rounded-md border px-4 py-2" onClick={onClick}>
      <svg className="z-10 mr-2 h-4 w-4 text-gray-500 " aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
        <path d="M20 4a2 2 0 0 0-2-2h-2V1a1 1 0 0 0-2 0v1h-3V1a1 1 0 0 0-2 0v1H6V1a1 1 0 0 0-2 0v1H2a2 2 0 0 0-2 2v2h20V4ZM0 18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8H0v10Zm5-8h10a1 1 0 0 1 0 2H5a1 1 0 0 1 0-2Z" />
      </svg>
      <div className="m-1 mr-2">(Select here): </div>
      {isUpdate ? lastDeworming.getDate().toString() + "/" + (lastDeworming.getMonth() + 1).toString() + "/" + lastDeworming.getFullYear().toString() : value}
    </button>
  );

  //----------------------------COMMUNICATION OF USER DETAILS---------------------------
  //Send user's details to user
  //const [sendUserDetails, setSendUserDetails] = useState(false);

  //-------------------------------UPDATE USER-----------------------------------------
  //Update the user's details in fields
  const handleUpdateUserProfile = async (id: number) => {
    setID(id);
    const user = pet_data_with_clinics_and_treatments?.find((user) => user.petID === id);
    if (user) {
      // Assuming userQuery.data contains the user object
      const userData = user;
      //Get all the clinic dates and put in a string array
      const clinicData = user?.clinic_data;
      const clinicDates: Clinic[] =
        clinicData?.map((clinic) => ({
          id: clinic.clinicID,
          date:
            clinic.clinic.date.getDate().toString() +
            "/" +
            ((clinic.clinic.date.getMonth() ?? 0) + 1).toString() +
            "/" +
            clinic.clinic.date.getFullYear().toString(),
          area: clinic.clinic.greaterArea.greaterArea,
        })) ?? [];
      // const clinicIDs = clinicData?.map((clinic) => clinic.clinicID) ?? [];

      //treatments
      const treatmentData: Treatment[] =
        user?.petTreatments?.map((treatment) => ({
          treatmentID: treatment.treatmentID,
          date: treatment.date.getDate().toString() + "/" + (treatment.date.getMonth() + 1).toString() + "/" + treatment.date.getFullYear().toString(),
          category: treatment.category,
          type: treatment.type.map((type) => type.type.type),
          comments: treatment.comments ?? "",
        })) ?? [];
      console.log("Treatment data: ", treatmentData);

      setID(userData?.petID ?? 0);
      setPetName(userData?.petName ?? "");
      setSpeciesOption(userData?.species ?? "Select one");
      setSexOption(userData?.sex ?? "Select one");
      setAgeOption(userData?.age ?? "Select one");
      // setBreedOption(userData?.breed ?? "Select one");
      setBreedList(userData?.breed ?? "Select here");
      setColourList(userData?.colour ?? "Select here");
      setColourOption("Select here");
      setSizeOption(userData?.size ?? "Select one");
      setMarkings(userData?.markings ?? "");
      setStatusOption(userData?.status ?? "Select one");
      console.log("Request signed at____ :", userData?.sterilisedRequestSigned);
      if (userData?.sterilisedRequestSigned === "") {
        console.log("Requested signed not here!!!!____");
        setSterilisationRequestSignedOption("Select one");
      } else {
        console.log("Requested signed here!!!!____");
        setSterilisationRequestSignedOption(userData?.sterilisedRequestSigned ?? "Select one");
      }

      console.log("BREED LIST: ", userData?.breed);

      if (userData?.species == "Cat") {
        //setColourOption("Select one");
        setColourOptions(colourCatOptions);
        setColourListOptions(
          colourCatOptions.map((colour) => ({
            colour: colour,
            state: userData.colour.includes(colour),
          })),
        );

        console.log("Breed options cat!!!!!: ", userData.breed);
        setBreedOptions(breedCatOptions);
        setBreedListOptions(
          breedCatOptions.map((breed) => ({
            breed: breed,
            state: userData.breed.includes(breed),
          })),
        );
        // setColourListOptions(colourCatOptions.map((colour) => ({ colour: colour, state: colourList.includes(colour) })));
      } else if (userData?.species == "Dog") {
        //setColourOption("Select one");
        setColourOptions(colourDogOptions);
        setColourListOptions(
          colourDogOptions.map((colour) => ({
            colour: colour,
            state: userData.colour.includes(colour),
          })),
        );

        console.log("Breed options dog!!!!!: ", userData.breed);
        console.log("All breed options dog!!!!!: ", breedDogOptions);
        setBreedOptions(breedDogOptions);
        setBreedListOptions(
          breedDogOptions.map((breed) => ({
            breed: breed,
            state: userData.breed.includes(breed),
          })),
        );
        // setColourListOptions(colourDogOptions.map((colour) => ({ colour: colour, state: colourList.includes(colour) })));
      }

      // setSterilisationStatusOption(userData?.sterilisedStatus.getFullYear() === 1970 ? "Select one" : "Yes");
      // setSterilisationRequestedOption(userData?.sterilisedRequested?.getFullYear() === 1970 ? "Select one" : "Yes");
      setSterilisationOutcomeOption(userData?.sterilisationOutcome ?? "Select one");
      const sterilisationOutcomeDate_ =
        userData?.sterilisationOutcome === "Actioned" || userData?.sterilisationOutcome === "No Show" || userData?.sterilisationOutcome === "No show"
          ? userData?.sterilisationOutcomeDate ?? new Date()
          : new Date();
      setSterilisationOutcomeDate(sterilisationOutcomeDate_);

      if (userData?.vaccinationShot1?.getFullYear() !== 1970) {
        setVaccinationShot1Option("Yes");
        console.log("Vaccination shot 1(!1970): ", userData?.vaccinationShot1);
      } else if (userData?.vaccinationShot1.getFullYear() === 1970) {
        console.log("Vaccination shot 1(1970): ", userData?.vaccinationShot1);
        setVaccinationShot1Option("Not yet");
      } else {
        console.log("Vaccination shot 1(select one): ", userData?.vaccinationShot1);
        setVaccinationShot1Option("Select one");
      }

      if (userData?.vaccinationShot2?.getFullYear() !== 1970) {
        console.log("Vaccination shot 2(!1970): ", userData?.vaccinationShot2);
        setVaccinationShot2Option("Yes");
      } else if (userData?.vaccinationShot2.getFullYear() === 1970) {
        console.log("Vaccination shot 2(1970): ", userData?.vaccinationShot2);
        setVaccinationShot2Option("Not yet");
      } else {
        console.log("Vaccination shot 2(select one): ", userData?.vaccinationShot2);
        setVaccinationShot2Option("Select one");
      }

      if (userData?.vaccinationShot3?.getFullYear() !== 1970) {
        console.log("Vaccination shot 3(!1970): ", userData?.vaccinationShot3);
        setVaccinationShot3Option("Yes");
      } else if (userData?.vaccinationShot3.getFullYear() === 1970) {
        console.log("Vaccination shot 3(1970): ", userData?.vaccinationShot3);
        setVaccinationShot3Option("Not yet");
      } else {
        console.log("Vaccination shot 3(select one): ", userData?.vaccinationShot3);
        setVaccinationShot3Option("Select one");
      }

      if (userData?.sterilisedStatus?.getFullYear() !== 1970) {
        setSterilisationStatusOption("Yes");
        // console.log("Vaccination shot 1(!1970): ", userData?.sterilisedStatus);
      } else if (userData?.sterilisedStatus.getFullYear() === 1970) {
        //  console.log("Vaccination shot 1(1970): ", userData?.vaccinationShot1);
        setSterilisationStatusOption("No");
      } else {
        //  console.log("Vaccination shot 1(select one): ", userData?.vaccinationShot1);
        setSterilisationStatusOption("Select one");
      }

      if (userData?.sterilisedRequested?.getFullYear() !== 1970) {
        setSterilisationRequestedOption("Yes");
        // console.log("Vaccination shot 1(!1970): ", userData?.sterilisedStatus);
      } else if (userData?.sterilisedRequested.getFullYear() === 1970) {
        //  console.log("Vaccination shot 1(1970): ", userData?.vaccinationShot1);
        setSterilisationRequestedOption("No");
      } else {
        //  console.log("Vaccination shot 1(select one): ", userData?.vaccinationShot1);
        setSterilisationRequestedOption("Select one");
      }
      setVaccinationShot1Date(userData?.vaccinationShot1 ?? new Date());
      setVaccinationShot2Date(userData?.vaccinationShot2 ?? new Date());
      setVaccinationShot3Date(userData?.vaccinationShot3 ?? new Date());

      sterilisationStatusOption === "Yes" ? setSterilisationStatusDate(userData?.sterilisedStatus ?? new Date()) : setSterilisationStatusDate(new Date());
      sterilisationRequestedOption === "Yes"
        ? setSterilisationRequestedDate(userData?.sterilisedRequested ?? new Date())
        : setSterilisationRequestedDate(new Date());

      // setVaccinationShot1Option(userData?.vaccinationShot1 ?? "Select one");
      // setVaccinationShot2Option(userData?.vaccinationShot2 ?? "Select one");
      // setVaccinationShot3Option(userData?.vaccinationShot3 ?? "Select one");
      setMembershipTypeOption(userData?.membership ?? "Select one");
      const membershipDate_ =
        userData?.membership === "Gold card holder" ||
        userData?.membership === "Standard card holder" ||
        userData?.membership === "Gold Card Holder" ||
        userData?.membership === "Standard Card Holder"
          ? userData?.membershipDate ?? new Date()
          : new Date();
      setMembershipDate(membershipDate_);

      setCardStatusOption(userData?.cardStatus ?? "Select one");
      setKennelList(userData?.kennelReceived ?? []);
      setLastDeworming(userData?.lastDeworming ?? new Date());
      //setClinicIDList(clinicIDs ?? []);
      setClinicList(clinicDates);

      setComments(userData?.comments ?? "");

      setTreatmentList(treatmentData);
      console.log("Treatment list: ", treatmentList);

      setOwnerID(userData?.owner?.ownerID ?? 0);
      setFirstName(userData?.owner.firstName ?? "");
      setSurname(userData?.owner?.surname ?? "");
      setGreaterArea(userData?.owner?.addressGreaterArea.greaterArea ?? "");
      setArea(userData?.owner?.addressArea?.area ?? "");

      setClinicListOptions(
        clinicsAttendedOptions.map((clinic) => ({
          id: clinic.clinicID,
          date: clinic.date.getDate().toString() + "/" + ((clinic.date.getMonth() ?? 0) + 1).toString() + "/" + clinic.date.getFullYear().toString(),
          area: clinic.greaterArea.greaterArea,
          state: clinicDates.map((clinic) => clinic.id).includes(clinic.clinicID),
        })),
      );

      setKennelListOptions(
        kennelsReceivedOptions.map((kennel) => ({
          year: kennel,
          state: userData.kennelReceived.includes(kennel),
        })),
      );
    }
    //isUpdate ? setIsUpdate(true) : setIsUpdate(true);
    //isCreate ? setIsCreate(false) : setIsCreate(false);
    setIsUpdate(true);
    setIsCreate(false);
  };

  //When vaccination is changed from Not yet to Yes then make the date today's date
  useEffect(() => {
    if (vaccinationShot1Option === "Yes" && vaccinationShot1Date.getFullYear() === 1970) {
      console.log("Changing vaccination 1's date to TODAY!!");
      setVaccinationShot1Date(new Date());
    }
    if (vaccinationShot2Option === "Yes" && vaccinationShot2Date.getFullYear() === 1970) {
      console.log("Changing vaccination 2's date to TODAY!!");
      setVaccinationShot2Date(new Date());
    }
    if (vaccinationShot3Option === "Yes" && vaccinationShot3Date.getFullYear() === 1970) {
      console.log("Changing vaccination 3's date to TODAY!!");
      setVaccinationShot3Date(new Date());
    }
  }, [vaccinationShot1Option, vaccinationShot2Option, vaccinationShot3Option]);

  //when the searchinfinitequery comes back successful notify that the record is available.
  type BusyRecord = {
    state: boolean;
    record: number;
  };
  const [recordBusy, setRecordBusy] = useState<BusyRecord>();
  useEffect(() => {
    const userRecord: BusyRecord = {
      state: false,
      record: 0,
    };

    setRecordBusy(userRecord);
  }, [queryData]);

  useEffect(() => {
    if (user) {
      // Assuming userQuery.data contains the user object
      const userData = user;
      //Get all the clinic dates and put in a string array
      const clinicData = user.clinic_data;
      const clinicDates: Clinic[] =
        clinicData?.map((clinic) => ({
          id: clinic.clinicID,
          date:
            clinic.clinic.date.getDate().toString() +
            "/" +
            ((clinic.clinic.date.getMonth() ?? 0) + 1).toString() +
            "/" +
            clinic.clinic.date.getFullYear().toString(),
          area: clinic.clinic.greaterArea.greaterArea,
        })) ?? [];
      //const clinicIDs = clinicData?.map((clinic) => clinic.clinicID) ?? [];

      //treatments
      const treatmentData: Treatment[] =
        user?.petTreatments?.map((treatment) => ({
          treatmentID: treatment.treatmentID,
          date: treatment.date.getDate().toString() + "/" + (treatment.date.getMonth() + 1).toString() + "/" + treatment.date.getFullYear().toString(),
          category: treatment.category,
          type: treatment.type.map((type) => type.type.type),
          comments: treatment.comments ?? "",
        })) ?? [];

      console.log("Treatment data: ", treatmentData);
      setPetName(userData?.petName ?? "");
      setSpeciesOption(userData?.species ?? "Select one");
      setSexOption(userData?.sex ?? "Select one");
      setAgeOption(userData?.age ?? "Select one");
      // setBreedOption(userData?.breed ?? "Select one");
      setBreedList(userData?.breed ?? "Select here");
      setColourList(userData?.colour ?? "Select here");
      setSizeOption(userData?.size ?? "Select one");
      setMarkings(userData?.markings ?? "");
      setStatusOption(userData?.status ?? "Select one");
      //setSterilisationStatusOption(userData?.sterilisedStatus ?? "Select one");
      //setSterilisationRequestedOption(userData?.sterilisedRequested ?? "Select one");
      //console.log("UseEffect Request signed at____ :", userData?.sterilisedRequestSigned);

      setSterilisationRequestSignedOption(userData?.sterilisedRequestSigned ?? "Select one");

      setSterilisationOutcomeOption(userData?.sterilisationOutcome ?? "Select one");

      if (userData?.vaccinationShot1.getFullYear() !== 1970) {
        setVaccinationShot1Option("Yes");
      } else {
        setVaccinationShot1Option("Not yet");
      }

      if (userData?.vaccinationShot2?.getFullYear() !== 1970) {
        setVaccinationShot2Option("Yes");
      } else {
        setVaccinationShot2Option("Not yet");
      }

      if (userData?.vaccinationShot3?.getFullYear() !== 1970) {
        setVaccinationShot3Option("Yes");
      } else {
        setVaccinationShot3Option("Not yet");
      }

      if (userData?.sterilisedStatus?.getFullYear() !== 1970) {
        setSterilisationStatusOption("Yes");
      } else {
        setSterilisationStatusOption("No");
      }

      if (userData?.sterilisedRequested?.getFullYear() !== 1970) {
        setSterilisationRequestedOption("Yes");
      } else {
        setSterilisationRequestedOption("No");
      }

      // setVaccinationShot1Option(userData?.vaccinationShot1 ? "Yes" : "Not yet");
      // setVaccinationShot2Option(userData?.vaccinationShot2 ? "Yes" : "Not yet");
      // setVaccinationShot3Option(userData?.vaccinationShot3 ? "Yes" : "Not yet");
      // setVaccinationShot1Option(userData?.vaccinationShot1 !== new Date(0) ? "Yes" : "Not yet");
      // setVaccinationShot2Option(userData?.vaccinationShot2 !== new Date(0) ? "Yes" : "Not yet");
      // setVaccinationShot3Option(userData?.vaccinationShot3 !== new Date(0) ? "Yes" : "Not yet");
      setVaccinationShot1Date(userData?.vaccinationShot1 ?? new Date());
      setVaccinationShot2Date(userData?.vaccinationShot2 ?? new Date());
      setVaccinationShot3Date(userData?.vaccinationShot3 ?? new Date());

      setSterilisationStatusDate(userData?.sterilisedStatus ?? new Date());
      setSterilisationRequestedDate(userData?.sterilisedRequested ?? new Date());
      //setVaccinationShot2Option(userData?.vaccinationShot2 ?? "Select one");
      //setVaccinationShot3Option(userData?.vaccinationShot3 ?? "Select one");
      setMembershipTypeOption(userData?.membership ?? "Select one");
      if (userData?.cardStatus === "") {
        setCardStatusOption("Select one");
      } else {
        setCardStatusOption(userData?.cardStatus ?? "Select one");
      }
      setKennelList(userData?.kennelReceived ?? []);
      setLastDeworming(userData?.lastDeworming ?? new Date());
      setStatusOption(userData?.status ?? "Select one");
      setComments(userData?.comments ?? "");
      setClinicList(clinicDates);
      setTreatmentList(treatmentData);
      console.log("Treatment list: ", treatmentList);
      //setClinicIDList(clinicIDs ?? []);

      console.log("Owner ID of the pet line 2420:   ", userData?.owner?.ownerID);
      //setOwnerID(userData?.owner?.ownerID ?? 0);
      setFirstName(userData?.owner?.firstName ?? "");
      setSurname(userData?.owner?.surname ?? "");
      setGreaterArea(userData?.owner?.addressGreaterArea.greaterArea ?? "");
      setArea(userData?.owner?.addressArea?.area ?? "");

      setClinicListOptions(
        clinicsAttendedOptions.map((clinic) => ({
          id: clinic.clinicID,
          date: clinic.date.getDate().toString() + "/" + ((clinic.date.getMonth() ?? 0) + 1).toString() + "/" + clinic.date.getFullYear().toString(),
          area: clinic.greaterArea.greaterArea,
          state: clinicDates.map((clinic) => clinic.id).includes(clinic.clinicID),
        })),
      );

      ////////////////////////////Commented out because maybe overriding pet colour and breed options (4 May 2024)
      // console.log("Updating colouroptions because of update variable");
      // if (userData?.species == "Cat") {
      //   //setColourOption("Select one");

      //   console.log("Updating colouroptions to cats because of update variable");
      //   setColourOptions(colourCatOptions);
      //   setColourListOptions(
      //     colourCatOptions.map((colour) => ({
      //       colour: colour,
      //       state: userData.colour.includes(colour),
      //     })),
      //   );

      //   // setBreedOptions(breedCatOptions);
      //   // setBreedListOptions(
      //   //   breedCatOptions.map((breed) => ({
      //   //     breed: breed,
      //   //     state: userData.breed.includes(breed),
      //   //   })),
      //   // );
      //   // setColourListOptions(colourCatOptions.map((colour) => ({ colour: colour, state: colourList.includes(colour) })));
      // } else if (userData?.species == "Dog") {
      //   console.log("Updating colouroptions to dogs because of update variable");
      //   //setColourOption("Select one");
      //   setColourOptions(colourDogOptions);
      //   setColourListOptions(
      //     colourDogOptions.map((colour) => ({
      //       colour: colour,
      //       state: userData.colour.includes(colour),
      //     })),
      //   );

      //   // setBreedOptions(breedDogOptions);
      //   // setBreedListOptions(
      //   //   breedDogOptions.map((breed) => ({
      //   //     breed: breed,
      //   //     state: userData.breed.includes(breed),
      //   //   })),
      //   // );
      //   // setColourListOptions(colourDogOptions.map((colour) => ({ colour: colour, state: colourList.includes(colour) })));
      // }

      setKennelListOptions(
        kennelsReceivedOptions.map((kennel) => ({
          year: kennel,
          state: userData.kennelReceived.includes(kennel),
        })),
      );
    }
  }, [isUpdate]); // Effect runs when userQuery.data changes
  //[user, isUpdate, isCreate];
  const handleUpdateUser = async () => {
    setIsLoading(true);

    //shwo that record is busy updating
    setRecordBusy({ state: true, record: id });

    //clinics attendance
    const clinicIDList = clinicList
      .sort((a, b) => {
        const dateA = new Date(a.date.split("/").reverse().join("-"));
        const dateB = new Date(b.date.split("/").reverse().join("-"));
        return dateA.getTime() - dateB.getTime();
      })
      .map((clinic) => (clinic.id ? clinic.id : 0));

    //vaccinations
    const vaccine1 = vaccinationShot1Option === "Yes" ? vaccinationShot1Date : new Date(0);
    const vaccine2 = vaccinationShot1Option === "Yes" ? (vaccinationShot2Option === "Yes" ? vaccinationShot2Date : new Date(0)) : new Date(0);
    const vaccine3 =
      vaccinationShot1Option === "Yes"
        ? vaccinationShot2Option === "Yes"
          ? vaccinationShot3Option === "Yes"
            ? vaccinationShot3Date
            : new Date(0)
          : new Date(0)
        : new Date(0);
    await updatePet.mutateAsync({
      petID: id,
      petName: petName,
      species: speciesOption === "Select one" ? "" : speciesOption,
      sex: sexOption === "Select one" ? "" : sexOption,
      age: ageOption === "Select one" ? "" : ageOption,
      breed: speciesOption === "Dog" ? breedList : ["Not Applicable"],
      colour: colourList,
      size: speciesOption === "Dog" ? (sizeOption === "Select one" ? "" : sizeOption) : "",
      markings: markings,
      status: statusOption === "Select one" ? "" : statusOption,
      sterilisedStatus: sterilisationStatusOption === "Yes" ? sterilisationStatusDate : new Date(0),
      sterilisedRequested: sterilisationRequestedOption === "Yes" ? sterilisationRequestedDate : new Date(0),
      sterilisedRequestSigned: sterilisationRequestSignedOption === "Select one" ? "" : sterilisationRequestSignedOption,
      sterilisedOutcome: sterilisationOutcomeOption === "Select one" ? "" : sterilisationOutcomeOption,
      sterilisationOutcomeDate:
        sterilisationOutcomeOption === "Actioned" || sterilisationOutcomeOption === "No show" || sterilisationOutcomeOption === "No Show"
          ? sterilisationOutcomeDate
          : new Date(0),
      vaccinationShot1: vaccine1,
      vaccinationShot2: vaccine2,
      vaccinationShot3: vaccine3,
      // vaccinationShot1: vaccinationShot1Option === "Yes" ? vaccinationShot1Date : new Date(),
      // vaccinationShot2: vaccinationShot2Option === "Yes" ? vaccinationShot2Date : new Date(0),
      // vaccinationShot3: vaccinationShot3Option === "Yes" ? vaccinationShot3Date : new Date(0),
      lastDeWorming: lastDeworming ?? new Date(),
      membership: membershipTypeOption === "Select one" ? "" : membershipTypeOption,
      membershipDate:
        membershipTypeOption === "Standard card holder" ||
        membershipTypeOption === "Gold card holder" ||
        membershipTypeOption === "Standard Card Holder" ||
        membershipTypeOption === "Gold Card Holder"
          ? membershipDate
          : new Date(0),
      cardStatus: cardStatusOption === "Select one" ? "" : cardStatusOption,
      kennelReceived: kennelList,
      clinicsAttended: clinicIDList,
      comments: comments,
      treatments: "",
    });
    //After the newUser has been created make sure to set the fields back to empty
    setPetName("");
    setSpeciesOption("Select one");
    setSexOption("Select one");
    setAgeOption("Select one");
    setBreedOption("Select here");
    setColourOption("Select here");
    setSizeOption("Select one");
    setMarkings("");
    setStatusOption("Select one");
    setSterilisationStatusOption("Select one");
    setSterilisationRequestedOption("Select one");
    setSterilisationRequestSignedOption("Select one");
    setSterilisationOutcomeOption("Select one");
    setSterilisationOutcomeDate(new Date());
    setVaccinationShot1Option("Select one");
    setVaccinationShot2Option("Select one");
    setVaccinationShot3Option("Select one");
    setVaccinationShot1Date(new Date());
    setVaccinationShot2Date(new Date());
    setVaccinationShot3Date(new Date());
    setMembershipTypeOption("Select one");
    setMembershipDate(new Date());
    setCardStatusOption("Select one");
    setKennelsReceivedOption("Select here");
    setLastDeworming(new Date());
    setComments("");
    setClinicList([]);
    setClinicsAttendedOption("Select here");
    // const clinics = clinicsAttendedOptions.map((clinic) => { id: clinic.clinicID, date: clinic.date, area: clinic.area.area, state: false });
    const clinics = clinicsAttendedOptions.map((clinic) => ({
      id: clinic.clinicID,
      date: clinic.date.getDate().toString() + "/" + ((clinic.date.getMonth() ?? 0) + 1).toString() + "/" + clinic.date.getFullYear().toString(),
      area: clinic.greaterArea.greaterArea,
      state: false,
    }));

    setColourListOptions(
      colourOptions.map((colour) => ({
        colour: colour,
        state: false,
      })),
    );

    setBreedListOptions(
      breedOptions.map((breed) => ({
        breed: breed,
        state: false,
      })),
    );

    setKennelListOptions(
      kennelsReceivedOptions.map((kennel) => ({
        year: kennel,
        state: false,
      })),
    );
    setClinicListOptions(clinics);
    setKennelList([]);
    setColourList([]);
    setBreedList([]);

    setTreatmentList([]);
    setShowClinicMessage(false);
    setIsUpdate(false);
    setIsCreate(false);
    setIsLoading(false);
  };

  //-------------------------------CREATE NEW USER-----------------------------------------
  //------------------------------------CREATE A NEW PET FOR OWNER--------------------------------------
  //When button is pressed the browser needs to go to the pet's page. The pet's page needs to know the owner's ID
  const handleAddNewPet = async (id: number, firstName: string, surname: string) => {
    // await router.push({
    //   pathname: "/inProgress",
    // });
    // await router.push({
    //   pathname: "/pet",
    //   query: { ownerID: id, firstName: firstName, surname: surname },
    // });
    setIsCreate(true);
    setIsUpdate(false);
    // setOwnerID(id);
    // setFirstName(firstName);
    // setSurname(surname);
    void handleCreateNewUser(id, firstName, surname);
  };

  const handleCreateNewUser = async (id: number, name: string, surname: string) => {
    //const query = router.asPath.split("?")[1] ?? "";

    console.log("OwnerID!!!: ", (router.asPath.split("?")[1] ?? "")?.split("&")[0]?.split("=")[1]);
    console.log("FirstName!!!: ", (router.asPath.split("?")[1] ?? "")?.split("&")[1]?.split("=")[1]);
    console.log("Surname!!!: ", (router.asPath.split("?")[1] ?? "")?.split("&")[2]?.split("=")[1]);
    // setOwnerID(Number(router.asPath.split("=")[1]));
    // setOwnerID(Number((router.asPath.split("?")[1] ?? "")?.split("&")[0]?.split("=")[1]));
    // setFirstName(String((router.asPath.split("?")[1] ?? "")?.split("&")[1]?.split("=")[1]?.replaceAll("+", " ")));
    // setSurname(String((router.asPath.split("?")[1] ?? "")?.split("&")[2]?.split("=")[1]?.replaceAll("+", " ")));

    console.log("OwnerID____: ", id);
    console.log("FirstName___: ", name);
    console.log("Surname___: ", surname);
    setOwnerID(id);
    console.log("OwnerID line 2615: ", ownerID);
    setFirstName(name);
    setSurname(surname);
    setPetName("");
    setSpeciesOption("Select one");
    setSexOption("Select one");
    setAgeOption("Select one");
    setBreedOption("Select here");
    setColourOption("Select here");
    setSizeOption("Select one");
    setMarkings("");
    setStatusOption("Active");
    setSterilisationStatusOption("Select one");
    setSterilisationRequestedOption("Select one");
    setSterilisationRequestSignedOption("Select one");
    setSterilisationStatusDate(new Date());
    setSterilisationRequestedDate(new Date());
    setSterilisationOutcomeOption("Select one");
    setSterilisationOutcomeDate(new Date());
    setVaccinationShot1Option("Select one");
    setVaccinationShot2Option("Select one");
    setVaccinationShot3Option("Select one");
    setVaccinationShot1Date(new Date());
    setVaccinationShot2Date(new Date());
    setVaccinationShot3Date(new Date());
    setMembershipTypeOption("Non-card Holder");
    setMembershipDate(new Date());
    setCardStatusOption("Select one");
    setKennelsReceivedOption("No kennels received");
    setStartingDate(new Date());
    setLastDeworming(new Date());
    setComments("");
    //isCreate ? setIsCreate(false) : setIsCreate(true);
    setClinicList([]);
    setColourList([]);
    setBreedList([]);
    setClinicsAttendedOption("Select here");
    const clinics = clinicsAttendedOptions.map((clinic) => ({
      id: clinic.clinicID,
      date: clinic.date.getDate().toString() + "/" + ((clinic.date.getMonth() ?? 0) + 1).toString() + "/" + clinic.date.getFullYear().toString(),
      area: clinic.greaterArea.greaterArea,
      state: false,
    }));
    setKennelListOptions(
      kennelsReceivedOptions.map((kennel) => ({
        year: kennel,
        state: false,
      })),
    );

    if (speciesOption == "Cat") {
      //setColourOption("Select one");
      setColourOptions(colourCatOptions);
      setColourListOptions(
        colourCatOptions.map((colour) => ({
          colour: colour,
          state: false,
        })),
      );

      setBreedOptions(breedCatOptions);
      setBreedListOptions(
        breedCatOptions.map((breed) => ({
          breed: breed,
          state: false,
        })),
      );
      // setColourListOptions(colourCatOptions.map((colour) => ({ colour: colour, state: colourList.includes(colour) })));
    } else if (speciesOption == "Dog") {
      //setColourOption("Select one");
      setColourOptions(colourDogOptions);
      setColourListOptions(
        colourDogOptions.map((colour) => ({
          colour: colour,
          state: false,
        })),
      );

      setBreedOptions(breedDogOptions);
      setBreedListOptions(
        breedDogOptions.map((breed) => ({
          breed: breed,
          state: false,
        })),
      );
      // setColourListOptions(colourDogOptions.map((colour) => ({ colour: colour, state: colourList.includes(colour) })));
    } else {
      setColourOptions([]);
      setColourListOptions([]);
      setBreedOptions([]);
      setBreedListOptions([]);
    }

    // setColourListOptions(
    //   colourOptions.map((colour) => ({
    //     colour: colour,
    //     state: false,
    //   })),
    // );
    setKennelList([]);
    setClinicListOptions(clinics);
    setTreatmentList([]);
    setIsCreate(true);
    setIsUpdate(false);
  };

  // useEffect(() => {
  //   if (isCreate && !isUpdate) {
  //     console.log("We have changed the species and will change the breed and colour options");
  //     if (speciesOption == "Cat") {
  //       //setColourOption("Select one");
  //       setColourOptions(colourCatOptions);
  //       setColourListOptions(
  //         colourCatOptions.map((colour) => ({
  //           colour: colour,
  //           state: false,
  //         })),
  //       );

  //       console.log("Changing the colours to cat ones");

  //       setBreedOptions(breedCatOptions);
  //       setBreedListOptions(
  //         breedCatOptions.map((breed) => ({
  //           breed: breed,
  //           state: false,
  //         })),
  //       );
  //       // setColourListOptions(colourCatOptions.map((colour) => ({ colour: colour, state: colourList.includes(colour) })));
  //     } else if (speciesOption == "Dog") {
  //       //setColourOption("Select one");
  //       setColourOptions(colourDogOptions);
  //       setColourListOptions(
  //         colourDogOptions.map((colour) => ({
  //           colour: colour,
  //           state: false,
  //         })),
  //       );

  //       console.log("Changing the colours to dog ones");

  //       setBreedOptions(breedDogOptions);
  //       setBreedListOptions(
  //         breedDogOptions.map((breed) => ({
  //           breed: breed,
  //           state: false,
  //         })),
  //       );
  //       // setColourListOptions(colourDogOptions.map((colour) => ({ colour: colour, state: colourList.includes(colour) })));
  //     }
  //   }
  //   // else if (isUpdate) {
  //   //   if (speciesOption == "Cat") {
  //   //     //setColourOption("Select one");
  //   //     setColourOptions(colourCatOptions);
  //   //     setColourListOptions(
  //   //       colourCatOptions.map((colour) => ({
  //   //         colour: colour,
  //   //         state: colourList.includes(colour),
  //   //       })),
  //   //     );

  //   //     setBreedOptions(breedCatOptions);
  //   //     setBreedListOptions(
  //   //       breedCatOptions.map((breed) => ({
  //   //         breed: breed,
  //   //         state: breedList.includes(breed),
  //   //       })),
  //   //     );
  //   //     // setColourListOptions(colourCatOptions.map((colour) => ({ colour: colour, state: colourList.includes(colour) })));
  //   //   } else if (speciesOption == "Dog") {
  //   //     //setColourOption("Select one");
  //   //     setColourOptions(colourDogOptions);
  //   //     setColourListOptions(
  //   //       colourDogOptions.map((colour) => ({
  //   //         colour: colour,
  //   //         state: colourList.includes(colour),
  //   //       })),
  //   //     );

  //   //     setBreedOptions(breedDogOptions);
  //   //     setBreedListOptions(
  //   //       breedDogOptions.map((breed) => ({
  //   //         breed: breed,
  //   //         state: breedList.includes(breed),
  //   //       })),
  //   //     );
  //   //     // setColourListOptions(colourDogOptions.map((colour) => ({ colour: colour, state: colourList.includes(colour) })));
  //   //   }
  //   // }
  // }, [speciesOption]);
  //-------------------------------NEW USER-----------------------------------------

  const handleNewUser = async () => {
    setIsLoading(true);
    console.log("Owner ID for pet creation: ", ownerID);
    const clinicIDList = clinicList
      .sort((a, b) => {
        const dateA = new Date(a.date.split("/").reverse().join("-"));
        const dateB = new Date(b.date.split("/").reverse().join("-"));
        return dateA.getTime() - dateB.getTime();
      })
      .map((clinic) => (clinic.id ? clinic.id : 0));

    //vaccinations
    const vaccine1 = vaccinationShot1Option === "Yes" ? vaccinationShot1Date : new Date(0);
    const vaccine2 = vaccinationShot1Option === "Yes" ? (vaccinationShot2Option === "Yes" ? vaccinationShot2Date : new Date(0)) : new Date(0);
    const vaccine3 =
      vaccinationShot1Option === "Yes"
        ? vaccinationShot2Option === "Yes"
          ? vaccinationShot3Option === "Yes"
            ? vaccinationShot3Date
            : new Date(0)
          : new Date(0)
        : new Date(0);

    // console.log("All clinics attended: ", clinicIDList);
    const newUser_ = await newPet.mutateAsync({
      //ownerID: Number((router.asPath.split("?")[1] ?? "")?.split("&")[0]?.split("=")[1]),
      ownerID: ownerID,
      petName: petName,
      species: speciesOption === "Select one" ? "" : speciesOption,
      sex: sexOption === "Select one" ? "" : sexOption,
      age: ageOption === "Select one" ? "" : ageOption,
      breed: speciesOption === "Dog" ? breedList : ["Not Applicable"],
      colour: colourList,
      size: speciesOption === "Dog" ? (sizeOption === "Select one" ? "" : sizeOption) : "",
      markings: markings,
      status: statusOption === "Select one" ? "" : statusOption,
      sterilisedStatus: sterilisationStatusOption === "Yes" ? sterilisationStatusDate : new Date(0),
      sterilisedRequested: sterilisationRequestedOption === "Yes" ? sterilisationRequestedDate : new Date(0),
      sterilisedRequestSigned: sterilisationRequestSignedOption === "Select one" ? "" : sterilisationRequestSignedOption,
      sterilisationOutcome: sterilisationOutcomeOption === "Select one" ? "" : sterilisationOutcomeOption,
      sterilisationOutcomeDate:
        sterilisationOutcomeOption === "Actioned" || sterilisationOutcomeOption === "No show" || sterilisationOutcomeOption === "No Show"
          ? sterilisationOutcomeDate
          : new Date(0),
      vaccinationShot1: vaccine1,
      vaccinationShot2: vaccine2,
      vaccinationShot3: vaccine3,
      // vaccinationShot1: vaccinationShot1Option === "Yes" ? vaccinationShot1Date : new Date(),
      // vaccinationShot2: vaccinationShot2Option === "Yes" ? vaccinationShot2Date : new Date(0),
      // vaccinationShot3: vaccinationShot3Option === "Yes" ? vaccinationShot3Date : new Date(0),
      // vaccinationShot1: vaccinationShot1Option === "Select one" ? "" : vaccinationShot1Option,
      // vaccinationShot2: vaccinationShot2Option === "Select one" ? "" : vaccinationShot2Option,
      // vaccinationShot3: vaccinationShot3Option === "Select one" ? "" : vaccinationShot3Option,
      lastDeWorming: lastDeworming ?? new Date(),
      membership: membershipTypeOption === "Select one" ? "" : membershipTypeOption,
      membershipDate:
        membershipTypeOption === "Standard card holder" ||
        membershipTypeOption === "Gold card holder" ||
        membershipTypeOption === "Standard Card Holder" ||
        membershipTypeOption === "Gold Card Holder"
          ? membershipDate
          : new Date(0),
      cardStatus: cardStatusOption === "Select one" ? "" : cardStatusOption,
      kennelReceived: kennelList,
      clinicsAttended: clinicIDList,
      comments: comments,
      treatments: "",
    });

    //Image upload
    //console.log("ID: ", newUser_?.petID, "Image: ", newUser_?.image, "Name: ", petName, "IsUploadModalOpen: ", isUploadModalOpen);
    //console.log("Clinics attended: ", newUser_.clinicsAttended);
    handleUploadModal(newUser_.petID, petName, newUser_?.image ?? "");
    setIsCreate(false);
    setIsUpdate(false);

    // return newUser_;

    //update identification table
    if (newUser_?.petID) {
      await updateIdentification.mutateAsync({
        petID: newUser_?.petID ?? 0,
      });
    }
    setIsLoading(false);
  };

  //-------------------------------VIEW PROFILE PAGE-----------------------------------------

  const handleViewProfilePage = async (id: number) => {
    //12 may 2024
    // if (router.asPath.includes("petID")) {
    //   void pet_?.refetch();
    // }
    setIsViewProfilePage(true);
    setID(id);

    //commented out 12 may 2024
    // const user = router.asPath.includes("petID")
    //   ? pet_data_with_clinics_and_treatments?.find((user) => user.petID === Number(router.asPath.split("=")[1]))
    //   : pet_data_with_clinics_and_treatments?.find((user) => user.petID === id);

    const user = pet_data_with_clinics_and_treatments?.find((user) => user.petID === id);

    //console.log("View profile page: ", JSON.stringify(user));

    // const pet = user ? user : user_individual_route.data;
    if (user) {
      // Assuming userQuery.data contains the user object
      const userData = user;
      //Get all the clinic dates and put in a string array
      const clinicData = user?.clinic_data ?? [];
      const clinicDates: Clinic[] =
        clinicData?.map((clinic) => ({
          id: clinic.clinicID,
          date:
            clinic.clinic.date.getDate().toString() +
            "/" +
            ((clinic.clinic.date.getMonth() ?? 0) + 1).toString() +
            "/" +
            clinic.clinic.date.getFullYear().toString(),
          area: clinic.clinic.greaterArea.greaterArea,
        })) ?? [];
      //const clinicIDs = clinicData?.map((clinic) => clinic.clinicID) ?? [];

      //treatments
      const treatmentData: Treatment[] =
        user?.petTreatments?.map((treatment) => ({
          treatmentID: treatment.treatmentID,
          date: treatment.date.getDate().toString() + "/" + (treatment.date.getMonth() + 1).toString() + "/" + treatment.date.getFullYear().toString(),
          category: treatment.category,
          type: treatment.type.map((type) => type.type.type),
          comments: treatment.comments ?? "",
        })) ?? [];

      console.log("Treatment data: ", treatmentData);
      setPetName(userData?.petName ?? "");
      setSpeciesOption(userData?.species ?? "");
      setSexOption(userData?.sex ?? "");
      setAgeOption(userData?.age ?? "");
      //  setBreedOption(userData?.breed ?? "");
      setBreedList(userData?.breed ?? "");
      setColourList(userData?.colour ?? "");
      setSizeOption(userData?.size ?? "");
      setMarkings(userData?.markings ?? "");
      setStatusOption(userData?.status ?? "");
      //setSterilisationStatusOption(userData?.sterilisedStatus ?? "");
      //setSterilisationRequestedOption(userData?.sterilisedRequested ?? "");
      setSterilisationOutcomeOption(userData?.sterilisationOutcome ?? "");
      const sterilisationOutcomeDate_ =
        userData?.sterilisationOutcome === "Actioned" || userData?.sterilisationOutcome === "No show" || userData?.sterilisationOutcome === "No Show"
          ? userData?.sterilisationOutcomeDate ?? new Date()
          : new Date();
      setSterilisationOutcomeDate(sterilisationOutcomeDate_);

      if (userData?.vaccinationShot1.getFullYear() !== 1970) {
        setVaccinationShot1Option("Yes");
      } else {
        setVaccinationShot1Option("Not yet");
      }

      if (userData?.vaccinationShot2?.getFullYear() !== 1970) {
        setVaccinationShot2Option("Yes");
      } else {
        setVaccinationShot2Option("Not yet");
      }

      if (userData?.vaccinationShot3?.getFullYear() !== 1970) {
        setVaccinationShot3Option("Yes");
      } else {
        setVaccinationShot3Option("Not yet");
      }

      if (userData?.sterilisedStatus?.getFullYear() !== 1970) {
        setSterilisationStatusOption("Yes");
        console.log("Sterilisation status: Yes, ", userData?.sterilisedStatus);
      } else {
        setSterilisationStatusOption("No");
        console.log("Sterilisation status: No, ", userData?.sterilisedStatus);
      }

      if (userData?.sterilisedRequested?.getFullYear() !== 1970) {
        setSterilisationRequestedOption("Yes");
      } else {
        setSterilisationRequestedOption("No");
      }

      // setVaccinationShot1Option(userData?.vaccinationShot1 != new Date(0) ? "Yes" : "Not yet");
      // setVaccinationShot2Option(userData?.vaccinationShot2 != new Date(0) ? "Yes" : "Not yet");
      // setVaccinationShot3Option(userData?.vaccinationShot3 != new Date(0) ? "Yes" : "Not yet");
      console.log("This is the viewProfile with vaccination 1:", userData?.vaccinationShot1);
      console.log("This is the viewProfile with vaccination 2:", userData?.vaccinationShot2);
      console.log("This is the viewProfile with vaccination 3:", userData?.vaccinationShot3);
      setVaccinationShot1Date(userData?.vaccinationShot1 ?? new Date());
      setVaccinationShot2Date(userData?.vaccinationShot2 ?? new Date());
      setVaccinationShot3Date(userData?.vaccinationShot3 ?? new Date());

      setSterilisationStatusDate(userData?.sterilisedStatus ?? new Date());
      setSterilisationRequestedDate(userData?.sterilisedRequested ?? new Date());

      setMembershipTypeOption(userData?.membership ?? "");
      const membershipDate_ =
        userData?.membership === "Gold card holder" ||
        userData?.membership === "Standard card holder" ||
        userData?.membership === "Gold Card Holder" ||
        userData?.membership === "Standard Card Holder"
          ? userData?.membershipDate ?? new Date()
          : new Date();
      setSterilisationOutcomeDate(membershipDate_);

      setCardStatusOption(userData?.cardStatus ?? "");
      setKennelList(userData?.kennelReceived ?? []);
      setLastDeworming(userData?.lastDeworming ?? new Date());
      setComments(userData?.comments ?? "");
      setClinicList(clinicDates);
      setTreatmentList(treatmentData);
      console.log("Treatment list: ", treatmentList);

      // setClinicIDList(clinicIDs ?? []);
      console.log("Owner ID!!!! line 2991:   ", userData?.owner?.ownerID);
      setOwnerID(userData?.owner?.ownerID ?? 0);
      setFirstName(userData?.owner?.firstName ?? "");
      setSurname(userData?.owner?.surname ?? "");
      setGreaterArea(userData?.owner?.addressGreaterArea.greaterArea ?? "");
      setArea(userData?.owner?.addressArea?.area ?? "");

      setClinicListOptions(
        clinicsAttendedOptions.map((clinic) => ({
          id: clinic.clinicID,
          date: clinic.date.getDate().toString() + "/" + ((clinic.date.getMonth() ?? 0) + 1).toString() + "/" + clinic.date.getFullYear().toString(),
          area: clinic.greaterArea.greaterArea,
          state: clinicDates.map((clinic) => clinic.id).includes(clinic.clinicID),
        })),
      );

      if (userData?.species == "Cat") {
        //setColourOption("Select one");
        setColourOptions(colourCatOptions);
        setColourListOptions(
          colourCatOptions.map((colour) => ({
            colour: colour,
            state: userData.colour.includes(colour),
          })),
        );

        setBreedOptions(breedCatOptions);
        setBreedListOptions(
          breedCatOptions.map((breed) => ({
            breed: breed,
            state: userData.breed.includes(breed),
          })),
        );
        // setColourListOptions(colourCatOptions.map((colour) => ({ colour: colour, state: colourList.includes(colour) })));
      } else if (userData?.species == "Dog") {
        //setColourOption("Select one");
        setColourOptions(colourDogOptions);
        setColourListOptions(
          colourDogOptions.map((colour) => ({
            colour: colour,
            state: userData.colour.includes(colour),
          })),
        );

        setBreedOptions(breedDogOptions);
        setBreedListOptions(
          breedDogOptions.map((breed) => ({
            breed: breed,
            state: userData.breed.includes(breed),
          })),
        );
        // setColourListOptions(colourDogOptions.map((colour) => ({ colour: colour, state: colourList.includes(colour) })));
      }

      setKennelListOptions(
        kennelsReceivedOptions.map((kennel) => ({
          year: kennel,
          state: userData.kennelReceived.includes(kennel),
        })),
      );
    }

    setIsUpdate(false);
    setIsCreate(false);
    setIsViewProfilePage(true);
  };

  //view profile useeffect incase data changes:
  useEffect(() => {
    if (isViewProfilePage) {
      const user = pet_data_with_clinics_and_treatments?.find((user) => user.petID === id);

      //console.log("View profile page: ", JSON.stringify(user));

      // const pet = user ? user : user_individual_route.data;
      if (user) {
        const userData = user;

        //Clinic data
        const clinicData = user?.clinic_data ?? [];
        const clinicDates: Clinic[] =
          clinicData?.map((clinic) => ({
            id: clinic.clinicID,
            date:
              clinic.clinic.date.getDate().toString() +
              "/" +
              ((clinic.clinic.date.getMonth() ?? 0) + 1).toString() +
              "/" +
              clinic.clinic.date.getFullYear().toString(),
            area: clinic.clinic.greaterArea.greaterArea,
          })) ?? [];
        setClinicList(clinicDates);

        //Vaccination Data
        if (userData?.vaccinationShot1.getFullYear() !== 1970) {
          setVaccinationShot1Option("Yes");
        } else {
          setVaccinationShot1Option("Not yet");
        }

        if (userData?.vaccinationShot2?.getFullYear() !== 1970) {
          setVaccinationShot2Option("Yes");
        } else {
          setVaccinationShot2Option("Not yet");
        }

        if (userData?.vaccinationShot3?.getFullYear() !== 1970) {
          setVaccinationShot3Option("Yes");
        } else {
          setVaccinationShot3Option("Not yet");
        }

        // setVaccinationShot1Option(userData?.vaccinationShot1 != new Date(0) ? "Yes" : "Not yet");
        // setVaccinationShot2Option(userData?.vaccinationShot2 != new Date(0) ? "Yes" : "Not yet");
        // setVaccinationShot3Option(userData?.vaccinationShot3 != new Date(0) ? "Yes" : "Not yet");
        console.log("This is the viewProfile useEffect with vaccination 1:", userData?.vaccinationShot1);
        console.log("This is the viewProfile useEffect with vaccination 2:", userData?.vaccinationShot2);
        console.log("This is the viewProfile useEffect with vaccination 3:", userData?.vaccinationShot3);
        setVaccinationShot1Date(userData?.vaccinationShot1 ?? new Date());
        setVaccinationShot2Date(userData?.vaccinationShot2 ?? new Date());
        setVaccinationShot3Date(userData?.vaccinationShot3 ?? new Date());
      }
    }
  }, [queryData]);

  const [getPet, setGetPet] = useState(false);
  const [rerenders, setRerenders] = useState(0);
  useEffect(() => {
    if (
      router.asPath.includes("petID") &&
      petName === "" &&
      (breedOption === "Select one" || breedOption === "") &&
      (speciesOption === "Select one" || speciesOption === "")
    ) {
      setRerenders(rerenders + 1);
      void pet_?.refetch();
      console.log("Fetching pet data.......");
      console.log("Pet name: ", petName);
      console.log("Pet data: ", pet_?.data);
      getPet ? setGetPet(false) : setGetPet(true);
    }

    if (router.asPath.includes("petID")) {
      //Uncomment if doing brute force method
      // if (ownerID === 0 && rerenders < 800 && router.asPath.includes("petID")) {
      //   setRerenders(rerenders + 1);
      //   setOwnerID(pet?.data?.owner_data?.ownerID ?? 0);
      //   getPet ? setGetPet(false) : setGetPet(true);
      // }

      //alternate method to get pet data

      // Assuming userQuery.data contains the user object
      const userData = pet_?.data;
      if (userData) {
        console.log("View profile page: ", JSON.stringify(userData));
        //Get all the clinic dates and put in a string array
        const clinicData = pet_?.data?.clinic_data;
        const clinicDates: Clinic[] =
          clinicData?.map((clinic) => ({
            id: clinic.clinicID,
            date:
              clinic.clinic.date.getDate().toString() +
              "/" +
              ((clinic.clinic.date.getMonth() ?? 0) + 1).toString() +
              "/" +
              clinic.clinic.date.getFullYear().toString(),
            area: clinic.clinic.greaterArea.greaterArea,
          })) ?? [];
        //const clinicIDs = clinicData?.map((clinic) => clinic.clinicID) ?? [];

        //treatments
        const treatmentData: Treatment[] =
          pet_?.data?.treatment_data?.map((treatment) => ({
            treatmentID: treatment.treatmentID,
            date: treatment.date.getDate().toString() + "/" + (treatment.date.getMonth() + 1).toString() + "/" + treatment.date.getFullYear().toString(),
            category: treatment.category,
            type: treatment.type.map((type) => type.type.type),
            comments: treatment.comments ?? "",
          })) ?? [];

        console.log("Treatment data: ", treatmentData);

        const petData = userData?.pet_data;

        if (isUpdate && router.asPath.includes("petID")) {
          setPetName(petData?.petName ?? "");
          setSpeciesOption(petData?.species ?? "Select one");
          setSexOption(petData?.sex ?? "Select one");
          setAgeOption(petData?.age ?? "Select one");
          //setBreedOption(petData?.breed ?? "Select one");
          setBreedList(petData?.breed ?? ["Select here"]);
          setColourList(petData?.colour ?? ["Select here"]);
          setSizeOption(petData?.size ?? "Select one");
          setMarkings(petData?.markings ?? "");
          setStatusOption(petData?.status ?? "Select one");
          console.log("URL UseEffect Request signed at____ :", petData?.sterilisedRequestSigned);
          setSterilisationRequestSignedOption(petData?.sterilisedRequestSigned ?? "Select one");
          setSterilisationStatusOption(
            petData?.sterilisedStatus === undefined || petData?.sterilisedStatus === null
              ? "Select one"
              : petData?.sterilisedStatus.getFullYear() === 1970
                ? "No"
                : "Yes",
          );
          setSterilisationRequestedOption(
            petData?.sterilisedRequested === undefined || petData?.sterilisedRequested === null
              ? "Select one"
              : petData?.sterilisedRequested.getFullYear() === 1970
                ? "No"
                : "Yes",
          );
          setSterilisationOutcomeOption(petData?.sterilisationOutcome ?? "Select one");

          setMembershipTypeOption(petData?.membership ?? "Select one");
          setCardStatusOption(petData?.cardStatus ?? "Select one");

          setVaccinationShot1Option(
            petData?.vaccinationShot1 === undefined || petData?.vaccinationShot1 === null
              ? "Select one"
              : petData?.vaccinationShot1.getFullYear() === 1970
                ? "No"
                : "Yes",
          );
          setVaccinationShot2Option(
            petData?.vaccinationShot2 === undefined || petData?.vaccinationShot2 === null
              ? "Select one"
              : petData?.vaccinationShot2.getFullYear() === 1970
                ? "No"
                : "Yes",
          );
          setVaccinationShot3Option(
            petData?.vaccinationShot3 === undefined || petData?.vaccinationShot3 === null
              ? "Select one"
              : petData?.vaccinationShot3.getFullYear() === 1970
                ? "No"
                : "Yes",
          );

          setClinicList(clinicDates);
          setTreatmentList(treatmentData);

          setClinicListOptions(
            clinicsAttendedOptions.map((clinic) => ({
              id: clinic.clinicID,
              date: clinic.date.getDate().toString() + "/" + ((clinic.date.getMonth() ?? 0) + 1).toString() + "/" + clinic.date.getFullYear().toString(),
              area: clinic.greaterArea.greaterArea,
              state: clinicDates.map((clinic) => clinic.id).includes(clinic.clinicID),
            })),
          );

          // console.log("This code may not execute now at all");

          if (petData?.species == "Cat") {
            //setColourOption("Select one");
            console.log("Changing the colours to cat ones!!!");
            setColourOptions(colourCatOptions);
            setColourListOptions(
              colourCatOptions.map((colour) => ({
                colour: colour,
                state: petData.colour.includes(colour) ?? false,
              })),
            );

            setBreedOptions(breedCatOptions);
            setBreedListOptions(
              breedCatOptions.map((breed) => ({
                breed: breed,
                state: petData.breed.includes(breed) ?? false,
              })),
            );
            // setColourListOptions(colourCatOptions.map((colour) => ({ colour: colour, state: colourList.includes(colour) })));
          } else if (petData?.species == "Dog") {
            //setColourOption("Select one");

            console.log("Changing the colours to dog ones!!!");
            setColourOptions(colourDogOptions);
            setColourListOptions(
              colourDogOptions.map((colour) => ({
                colour: colour,
                state: petData.colour.includes(colour) ?? false,
              })),
            );

            setBreedOptions(breedDogOptions);
            setBreedListOptions(
              breedDogOptions.map((breed) => ({
                breed: breed,
                state: petData.breed.includes(breed) ?? false,
              })),
            );
            // setColourListOptions(colourDogOptions.map((colour) => ({ colour: colour, state: colourList.includes(colour) })));
          }

          setKennelListOptions(
            kennelsReceivedOptions.map((kennel) => ({
              year: kennel,
              state: petData?.kennelReceived.includes(kennel) ?? false,
            })),
          );

          setKennelList(petData?.kennelReceived ?? []);
        }
        if (isViewProfilePage) {
          console.log("This should not execute because only view porifle button pressed");
          setPetName(petData?.petName ?? "");
          setSpeciesOption(petData?.species ?? "");
          setSexOption(petData?.sex ?? "");
          setAgeOption(petData?.age ?? "");
          //setBreedOption(petData?.breed ?? "");
          setBreedList(petData?.breed ?? ["Select here"]);
          setColourList(petData?.colour ?? ["Select here"]);
          setSizeOption(petData?.size ?? "");
          setMarkings(petData?.markings ?? "");
          setStatusOption(petData?.status ?? "");
          console.log("View profile useEffect Request signed at____ :", petData?.sterilisedRequestSigned);

          setSterilisationRequestSignedOption(petData?.sterilisedRequestSigned ?? "");
          setSterilisationStatusOption(
            petData?.sterilisedStatus === undefined || petData?.sterilisedStatus === null
              ? ""
              : petData?.sterilisedStatus.getFullYear() === 1970
                ? "No"
                : "Yes",
          );
          setSterilisationRequestedOption(
            petData?.sterilisedRequested === undefined || petData?.sterilisedRequested === null
              ? ""
              : petData?.sterilisedRequested.getFullYear() === 1970
                ? "No"
                : "Yes",
          );
          setSterilisationOutcomeOption(petData?.sterilisationOutcome ?? "");
          setMembershipTypeOption(petData?.membership ?? "");
          setCardStatusOption(petData?.cardStatus ?? "");

          setVaccinationShot1Option(
            petData?.vaccinationShot1 === undefined || petData?.vaccinationShot1 === null
              ? ""
              : petData?.vaccinationShot1.getFullYear() === 1970
                ? "No"
                : "Yes",
          );
          setVaccinationShot2Option(
            petData?.vaccinationShot2 === undefined || petData?.vaccinationShot2 === null
              ? ""
              : petData?.vaccinationShot2.getFullYear() === 1970
                ? "No"
                : "Yes",
          );
          setVaccinationShot3Option(
            petData?.vaccinationShot3 === undefined || petData?.vaccinationShot3 === null
              ? ""
              : petData?.vaccinationShot3.getFullYear() === 1970
                ? "No"
                : "Yes",
          );
        }

        // setVaccinationShot1Date(petData?.vaccinationShot1 ?? new Date());
        // setVaccinationShot2Date(petData?.vaccinationShot2 ?? new Date());
        // setVaccinationShot3Date(petData?.vaccinationShot3 ?? new Date());
        setSterilisationStatusDate(petData?.sterilisedStatus ?? new Date());
        setSterilisationRequestedDate(petData?.sterilisedRequested ?? new Date());

        setKennelList(petData?.kennelReceived ?? []);
        setLastDeworming(petData?.lastDeworming ?? new Date());
        setComments(petData?.comments ?? "");
        setClinicList(clinicDates);
        setTreatmentList(treatmentData);

        setClinicListOptions(
          clinicsAttendedOptions.map((clinic) => ({
            id: clinic.clinicID,
            date: clinic.date.getDate().toString() + "/" + ((clinic.date.getMonth() ?? 0) + 1).toString() + "/" + clinic.date.getFullYear().toString(),
            area: clinic.greaterArea.greaterArea,
            state: clinicDates.map((clinic) => clinic.id).includes(clinic.clinicID),
          })),
        );

        /////////////////////////////Commented out because maybe overriding the breed and colour options (4 May 2024)
        // if (petData?.species == "Cat") {
        //   //setColourOption("Select one");
        //   setColourOptions(colourCatOptions);
        //   setColourListOptions(
        //     colourCatOptions.map((colour) => ({
        //       colour: colour,
        //       state: petData.colour.includes(colour) ?? false,
        //     })),
        //   );

        //   setBreedOptions(breedCatOptions);
        //   setBreedListOptions(
        //     breedCatOptions.map((breed) => ({
        //       breed: breed,
        //       state: petData.breed.includes(breed) ?? false,
        //     })),
        //   );
        //   // setColourListOptions(colourCatOptions.map((colour) => ({ colour: colour, state: colourList.includes(colour) })));
        // } else if (petData?.species == "Dog") {
        //   //setColourOption("Select one");
        //   setColourOptions(colourDogOptions);
        //   setColourListOptions(
        //     colourDogOptions.map((colour) => ({
        //       colour: colour,
        //       state: petData.colour.includes(colour) ?? false,
        //     })),
        //   );

        //   setBreedOptions(breedDogOptions);
        //   setBreedListOptions(
        //     breedDogOptions.map((breed) => ({
        //       breed: breed,
        //       state: petData.breed.includes(breed) ?? false,
        //     })),
        //   );
        //   // setColourListOptions(colourDogOptions.map((colour) => ({ colour: colour, state: colourList.includes(colour) })));
        // }

        setKennelListOptions(
          kennelsReceivedOptions.map((kennel) => ({
            year: kennel,
            state: petData?.kennelReceived.includes(kennel) ?? false,
          })),
        );

        // setClinicIDList(clinicIDs ?? []);
        const ownerData = userData?.owner_data;

        console.log("Owner data line 3340: ", ownerData);

        setOwnerID(ownerData?.ownerID ?? 0);
        setFirstName(ownerData?.firstName ?? "");
        setSurname(ownerData?.surname ?? "");
        setGreaterArea(ownerData?.addressGreaterArea.greaterArea ?? "");
        setArea(ownerData?.addressArea?.area ?? "");
      }
    }
  }, [getPet]); // Effect runs when userQuery.data changes
  //[isViewProfilePage, user]

  //Go to update page from the view profile page
  const handleUpdateFromViewProfilePage = async () => {
    setIsUpdate(true);
    setIsViewProfilePage(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  //-------------------------------BACK BUTTON-----------------------------------------
  const handleBackButton = async () => {
    //console.log("Back button pressed");

    //if owner id in query then go back to owner page
    // if (router.asPath.includes("petID") && !isUpdate && !isCreate) {
    //   // if (Number(router.asPath.split("=")[1]) != 0) {
    //   await router.push(`/owner`);
    // }

    // setQuery("");

    setIsUpdate(false);
    setIsCreate(false);
    setIsViewProfilePage(false);
    setIsUploadModalOpen(false);
    setID(0);
    setPetName("");
    setSpeciesOption("Select one");
    setSexOption("Select one");
    setAgeOption("Select one");
    setBreedOption("Select here");
    setColourOption("Select here");
    setSizeOption("Select one");
    setMarkings("");
    setStatusOption("Select one");
    setSterilisationStatusOption("Select one");
    setSterilisationRequestedOption("Select one");
    setSterilisationOutcomeOption("Select one");
    setSterilisationOutcomeDate(new Date());
    setVaccinationShot1Option("Select one");
    setVaccinationShot2Option("Select one");
    setVaccinationShot3Option("Select one");
    setVaccinationShot1Date(new Date());
    setVaccinationShot2Date(new Date());
    setVaccinationShot3Date(new Date());
    setClinicsAttendedOption("Select here");
    setMembershipTypeOption("Select one");
    setMembershipDate(new Date());
    setCardStatusOption("Select one");
    setKennelsReceivedOption("Select here");
    setComments("");
    setClinicList([]);
    setColourList([]);
    setBreedList([]);
    setTreatmentList([]);
    setShowClinicMessage(false);
    setColourSelection({ allSelected: false, clear: false });
    setClinicSelection({ allSelected: false, clear: false });
    setKennelList([]);
    setKennelSelection({ allSelected: false, clear: false });

    window.history.replaceState(null, "", "/pet");
    //await router.replace("/pet", undefined, { shallow: true });
    // await router.push({
    //   pathname: "/pet",
    //   query: {},
    // });
  };

  //-----------------------------PREVENTATIVE ERROR MESSAGES---------------------------
  //pet name only alphabetical characters allowed
  const [petNameErrorMessage, setPetNameErrorMessage] = useState("");
  useEffect(() => {
    if (petName.match(/[^a-zA-Z0-9 ]/g)) {
      setPetNameErrorMessage("Only letters and numbers are allowed");
    } else {
      setPetNameErrorMessage("");
    }
  }, [petName]);

  //-------------------------------MODAL-----------------------------------------
  //CREATE BUTTON MODAL
  const [isCreateButtonModalOpen, setIsCreateButtonModalOpen] = useState(false);
  const [mandatoryFields, setMandatoryFields] = useState<string[]>([]);
  const [errorFields, setErrorFields] = useState<{ field: string; message: string }[]>([]);

  const handleCreateButtonModal = () => {
    const mandatoryFields: string[] = [];
    const errorFields: { field: string; message: string }[] = [];

    if (petName === "") mandatoryFields.push("Pet Name");
    if (speciesOption === "Select one") mandatoryFields.push("Species");
    if (sexOption === "Select one") mandatoryFields.push("Sex");
    if (ageOption === "Select one") mandatoryFields.push("Age");
    if (breedList.length === 0 && speciesOption === "Dog") mandatoryFields.push("Breed");

    //if (breedOption === "Select one") mandatoryFields.push("Breed");
    // if (colourOption === "Select one") mandatoryFields.push("Colour");
    // if (markings === "") mandatoryFields.push("Markings");
    if (statusOption === "Select one") mandatoryFields.push("Status");
    if (sterilisationStatusOption === "Select one") mandatoryFields.push("Sterilisation Status");
    //  if (sterilisationRequestedOption === "Select one") mandatoryFields.push("Sterilisation Requested");
    // if (sterilisationOutcomeOption === "Select one") mandatoryFields.push("Sterilisation Outcome");
    if (vaccinationShot1Option === "Select one") mandatoryFields.push("Vaccination Shot 1");
    //if (vaccinationShot2Option === "Select one") mandatoryFields.push("Vaccination Shot 2");
    //if (vaccinationShot3Option === "Select one") mandatoryFields.push("Vaccination Shot 3");
    if (membershipTypeOption === "Select one") mandatoryFields.push("Membership Type");
    // if (kennelsReceivedOption === "Select one") mandatoryFields.push("Kennels Received");

    //if petName has non alphabetical characters
    if (petNameErrorMessage !== "") errorFields.push({ field: "Pet Name", message: petNameErrorMessage });

    setMandatoryFields(mandatoryFields);
    setErrorFields(errorFields);

    if (mandatoryFields.length > 0 || errorFields.length > 0) {
      setIsCreateButtonModalOpen(true);
    } else {
      if (isUpdate) {
        void handleUpdateUser();
      } else {
        setIsUploadModalOpen(true);
        void handleNewUser();
      }
    }
  };

  //TREATMENT MODAL
  const [isTreatmentModalOpen, setIsTreatmentModalOpen] = useState(false);
  const [treatmentModal, setTreatmentModal] = useState<Treatment>();
  const handleTreatmentModal = (id: number, category: string, type: string[], date: string, comments: string) => {
    if (ownUser?.role === "General Data Capturer") return;
    setTreatmentModal({ treatmentID: id, category: category, type: type, date: date, comments: comments });
    setIsTreatmentModalOpen(true);
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

  //UPLOAD BUTTON MODAL
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  // const [uploadModalID, setUploadModalID] = useState("");
  const [uploadUserName, setUploadUserName] = useState("");
  const [uploadUserImage, setUploadUserImage] = useState("");
  const [uploadUserID, setUploadUserID] = useState("");
  const handleUploadModal = (petID: number, name: string, image: string) => {
    setIsUploadModalOpen(true);
    console.log("UserID: " + petID + " Name: " + name + " Image: " + image + "IsUploadModalOpen: " + isUploadModalOpen);
    //setIsCreate(true);
    setUploadUserID(String(petID));
    // setUploadModalID(userID);
    setUploadUserName(name);
    setUploadUserImage(image);
    //setIsUploadModalOpen(true);
  };

  //refetch the image so that it updates
  useEffect(() => {
    if (isUploadModalOpen) {
      //void user.refetch();
    }
  }, [isUploadModalOpen]);

  //-------------------------------UPLOAD OPEN MODAL-----------------------------------------
  useEffect(() => {
    console.log("handle: IsUploadModalOpen: " + isUploadModalOpen + " IsCreate: " + isCreate);
    if (!isUploadModalOpen && isCreate) {
      setIsUploadModalOpen(true);
      console.log("handle: isUploadModalOpen: " + isUploadModalOpen + " IsCreate: " + isCreate);
    }
  }, [isCreate]);

  //-------------------------------ORDER FIELDS-----------------------------------------
  const handleOrderFields = (field: string) => {
    setOrder(field);
  };

  //------------------------------------GO TO OWNER PROFILE--------------------------------------
  const handleGoToOwnerProfile = async (ownerID: number) => {
    if (ownerID !== 0) {
      await router.push({
        pathname: "/owner",
        query: { ownerID: ownerID },
      });
    }
  };

  //------------------------------------GO TO TREATMENT PROFILE--------------------------------------
  const handleGoToTreatmentProfile = async (treatmentID: number) => {
    if (ownUser?.role === "General Data Capturer") return;

    console.log("Going to treatment profile: ", treatmentID);
    await router.push({
      pathname: "/treatment",
      query: { treatmentID: treatmentID },
    });
  };

  //------------------------------------CREATE A NEW TREATMENT FOR PET--------------------------------------
  //When button is pressed the browser needs to go to the treatment's page. The treatment's page needs to know the pet's ID
  const handleCreateNewTreatment = async (id: number) => {
    if (ownUser?.role === "General Data Capturer") return;

    await router.push({
      pathname: "/treatment",
      query: {
        petID: id,
        petName: petName ? petName : pet_data_with_clinics_and_treatments?.find((pet) => pet.petID === id)?.petName,
        ownerID: ownerID ? ownerID : pet_data_with_clinics_and_treatments?.find((pet) => pet.petID === id)?.ownerID,
        firstName: firstName ? firstName : pet_data_with_clinics_and_treatments?.find((pet) => pet.petID === id)?.owner?.firstName,
        surname: surname ? surname : pet_data_with_clinics_and_treatments?.find((pet) => pet.petID === id)?.owner?.surname,
        greaterArea: greaterArea ? greaterArea : pet_data_with_clinics_and_treatments?.find((pet) => pet.petID === id)?.owner?.addressGreaterArea.greaterArea,
        area: area ? area : pet_data_with_clinics_and_treatments?.find((pet) => pet.petID === id)?.owner?.addressArea?.area ?? "",
      },
    });
  };

  //------------------------------------ADD AN EXISTING CLINIC FOR PET--------------------------------------
  const [todayClinicList, setTodayClinicList] = useState<Clinic[]>([]);

  //show the clinic list for today
  const [showTodayClinics, setShowTodayClinics] = useState(false);
  const clinicRef = useRef<HTMLDivElement>(null);
  const [petIDForClinic, setPetIDForClinic] = useState(0);
  const [petIDsForClinics, setPetIDsForClinics] = useState([0]);
  const [isClinicLoading, setIsClinicLoading] = useState(false);
  // const btnClinicRef = useRef<HTMLButtonElement>(null);

  //Key value pair of the petID that is the key and a clinicList that is value
  const [petClinicList, setPetClinicList] = useState<Record<number, Clinic[]>>({});

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        clinicRef.current &&
        !clinicRef.current.contains(event.target as Node)
        // btnClinicRef.current &&
        // !btnClinicRef.current.contains(event.target as Node)
      ) {
        console.log("Today clinic: ", showTodayClinics);
        setShowTodayClinics(false);
        setTodayClinicList([]);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  //Search for a clinic date and clinic ID given today's date. Todays date needs to match up with the clinic date for the clinic to be added to the pet
  const handleAddClinic = async (id: number) => {
    const user = pet_data_with_clinics_and_treatments?.find((pet) => pet.petID === id);

    const clinicData = user?.clinic_data ?? [];
    const clinicDates: Clinic[] =
      clinicData?.map((clinic) => ({
        id: clinic.clinicID,
        date:
          clinic.clinic.date.getDate().toString() +
          "/" +
          ((clinic.clinic.date.getMonth() ?? 0) + 1).toString() +
          "/" +
          clinic.clinic.date.getFullYear().toString(),
        area: clinic.clinic.greaterArea.greaterArea,
      })) ?? [];
    //if (clinicList.length > clinicDates.length && id === petIDForClinic) return;

    console.log("Pet Clinic list: ", petClinicList);
    console.log("Pet ID: ", id);
    console.log("Clinic Dates: ", clinicDates);

    if (petClinicList[id] && (petClinicList[id]?.length ?? 0) > clinicDates.length) return;

    //take away the petClinicInstance from the petClinicList if it matches the petID and all the clinicDates
    // if (petClinicList[id] && petClinicList[id]?.length === clinicDates.length) {
    //   //setPetClinicList({ ...petClinicList, [id]: [] });
    //   //filter out the petClinicInstance that matches the petID
    //   const petClinicInstances = Object.keys(petClinicList).filter((petID) => Number(petID) !== id);
    //   const newPetClinicList: Record<number, Clinic[]> = {};
    //   for (const petID of petClinicInstances) {
    //     newPetClinicList[Number(petID)] = petClinicList[Number(petID)] ?? [];
    //   }
    //   setPetClinicList(newPetClinicList);
    //   //return;
    // }

    setClinicList(clinicDates);

    setShowTodayClinics(true);

    setPetIDForClinic(id);

    //setPetClinicList({ ...petClinicList, [id]: clinicDates });

    //get today's date
    const today = new Date();
    //add to the clinic list and ID list and then add it to the table
    //check if the clinic date is today's date
    const option = clinicsAttendedOptions.filter(
      (clinic) => clinic.date.getDate() === today.getDate() && clinic.date.getMonth() === today.getMonth() && clinic.date.getFullYear() === today.getFullYear(),
    );
    console.log("All clinics today: ", option);

    const clinicTodayList: Clinic[] = [];
    //Search for the clinic's of today in the clinic list
    for (const clinic of option) {
      const date = clinic?.date.getDate().toString() + "/" + (clinic?.date.getMonth() + 1).toString() + "/" + clinic?.date.getFullYear().toString();
      clinicTodayList.push({ id: clinic?.clinicID ?? 0, date: date, area: clinic?.greaterArea.greaterArea ?? "" });

      // //if (!clinicIDList.includes(clinic?.clinicID)) {
      // const date = clinic?.date.getDate().toString() + "/" + (clinic?.date.getMonth() + 1).toString() + "/" + clinic?.date.getFullYear().toString();
      // setTodayClinicList([...todayClinicList, { id: clinic?.clinicID ?? 0, date: date, area: clinic?.area ?? "" }]);
      // //}
    }

    setTodayClinicList(clinicTodayList);

    console.log("Today's clinic list: ", todayClinicList);

    // setTodayClinicList([...todayClinicList, { id: option[0].clinicID, date: option[0].date }]);
    // const optionDate = option?.date.getDate().toString() + "/" + option?.date.getMonth().toString() + "/" + option?.date.getFullYear().toString();
    // const optionID = option?.clinicID ?? 0;

    // if (!clinicIDList.includes(optionID) && optionID != 0) {
    //   setClinicList([...clinicList, String(optionDate)]);
    //   setClinicIDList([...clinicIDList, optionID]);

    //   //update the pet table to add the clinic to the pet
    //   await addClinic.mutateAsync({
    //     petID: id,
    //     clinicID: optionID,
    //   });
    // }
  };

  // useEffect(() => {
  //   if (!isUpdate && !isCreate && !isViewProfilePage) {
  //     const clinics = pet_data_with_clinics_and_treatments?.find((pet) => pet.petID === petIDForClinic)?.clinic_data;
  //     const clinics_ =
  //       clinics?.map((clinic) => ({
  //         id: clinic.clinicID,
  //         date:
  //           clinic.clinic.date.getDate().toString() + "/" + (clinic.clinic.date.getMonth() + 1).toString() + "/" + clinic.clinic.date.getFullYear().toString(),
  //         area: clinic.clinic.greaterArea.greaterArea,
  //       })) ?? [];
  //     setClinicList(clinics_);
  //     console.log("Clinic list: ", clinics_);
  //   }
  // }, [todayClinicList]);

  // //take out the petID and clinics from the petClinicList where the length of the clinics is the same as the clinics from DB
  // useEffect(() => {
  //   if (!isUpdate && !isCreate && !isViewProfilePage) {
  //     const petClinicInstances = Object.keys(petClinicList).filter((petID) => petClinicList[Number(petID)]?.length === clinicList.length);
  //     const newPetClinicList: Record<number, Clinic[]> = {};
  //     for (const petID of petClinicInstances) {
  //       const clinicData = pet_data_with_clinics_and_treatments?.find((pet) => pet.petID === Number(petID))?.clinic_data;
  //       const clinicDates: Clinic[] =
  //         clinicData?.map((clinic) => ({
  //           id: clinic.clinicID,
  //           date:
  //             clinic.clinic.date.getDate().toString() +
  //             "/" +
  //             ((clinic.clinic.date.getMonth() ?? 0) + 1).toString() +
  //             "/" +
  //             clinic.clinic.date.getFullYear().toString(),
  //           area: clinic.clinic.greaterArea.greaterArea,
  //         })) ?? [];

  //       if (clinicDates.length < petClinicList[Number(petID)]?.length ?? 0) {
  //         newPetClinicList[Number(petID)] = petClinicList[Number(petID)] ?? [];
  //       }
  //     }
  //     console.log("New pet clinic list: ", newPetClinicList);
  //     setPetClinicList(newPetClinicList);
  //   }
  // }, [clinicList]);

  const handleAddTodaysClinic = async (petID: number, clinicID: number) => {
    if (addClinic.isLoading) return;
    setIsClinicLoading(true);

    const clinicIDList = clinicList.map((clinic) => (clinic.id ? clinic.id : 0));

    const petClinicIDList = petClinicList[petID]?.map((clinic) => clinic.id) ?? [];

    console.log("Clinic ID list!!!: ", clinicIDList);
    console.log("Clinic ID!!!: ", clinicID);
    console.log("Pet ID!!!: ", petID);
    console.log("Pet Clinic ID list!!!: ", petClinicIDList);
    console.log("Pet Clinic List!!!: ", petClinicList);

    if (!clinicIDList.includes(clinicID) && !petClinicIDList.includes(clinicID)) {
      console.log("This is not added twice");
      setClinicList([...clinicList, todayClinicList.find((clinic) => clinic.id === clinicID) ?? { id: 0, date: "", area: "" }]);
      //setClinicList([...clinicList, todayClinicList.find((clinic) => clinic.id === clinicID)?.date ?? ""]);
      //setClinicIDList([...clinicIDList, clinicID]);
      //update the pet table to add the clinic to the pet
      await addClinic.mutateAsync({
        petID: petID,
        clinicID: clinicID,
      });

      setPetClinicList({
        ...petClinicList,
        [petID]: [...(petClinicList[petID] ?? []), todayClinicList.find((clinic) => clinic.id === clinicID) ?? { id: 0, date: "", area: "" }],
      });
    }
    setShowTodayClinics(false);
    setTodayClinicList([]);
    //setPetIDForClinic(0);
    setIsClinicLoading(false);
  };

  //retrieves the data from the table again when the clinicsAttended is updated
  useEffect(() => {
    void refetch();
  }, [isClinicLoading, clinicList, todayClinicList, addClinic.isSuccess, newPet.isSuccess, updatePet.isSuccess]);

  // ----------------------------------------Uploading Image----------------------------------------
  useEffect(() => {
    if (user?.image != "" && isDoneUploading) {
      setIsDoneUploading(false);
    }
  }, [user, isCreate, isUpdate, isViewProfilePage]);

  //------------------------------------------DOWNLOADING PET TABLE TO EXCEL FILE------------------------------------------
  const downloadPetTable = api.pet.download.useQuery({ searchQuery: query }, { enabled: hasAccess });
  const handleDownloadPetTable = async () => {
    setIsLoading(true);
    //take the download user table query data and put it in an excel file
    const data = downloadPetTable.data;
    const fileName = "Pet Table";
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
        <title>Pet Profiles</title>
      </Head>
      <main className="relative flex flex-col text-normal">
        <Navbar />
        {!isCreate && !isUpdate && !isViewProfilePage && (
          <>
            <div className="flex flex-col text-black">
              <DeleteButtonModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                userID={deleteModalID}
                userName={deleteModalName}
                onDelete={() => handleDeleteRow(deleteVolunteerID)}
              />
              <ImageUploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                userID={uploadUserID}
                userType={"volunteer"}
                userName={uploadUserName}
                userImage={uploadUserImage}
              />

              <div className="sticky top-20 z-20 bg-white py-4">
                <div className="relative flex justify-center">
                  <button
                    className="absolute left-0 top-0 mx-3 mb-3 rounded-lg bg-main-orange p-3 text-white hover:bg-orange-500"
                    onClick={handleDownloadPetTable}
                  >
                    {isLoading ? (
                      <div
                        className="mx-2 inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-current border-white border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
                        role="status"
                      />
                    ) : (
                      <div>Download Pet Table</div>
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

                  {/* <div className="border-2 bg-gray-300 p-3 text-blue-500">
                    Upload
                    <input type="file" onChange={(e) => void handleUpload(e)} accept=".xlsx, .xls" />
                  </div> */}

                  {/* <button className="absolute left-0 top-0 mx-3 mb-3 rounded-lg bg-main-orange p-3 hover:bg-orange-500" onClick={handleDeleteAllUsers}>
                    Delete all users
                  </button> */}
                </div>
              </div>
              {pet_data_with_clinics_and_treatments ? (
                // <article className="my-6 flex max-h-[60%] w-full items-center justify-center overflow-auto rounded-md shadow-inner">
                //   <table className="table-auto">
                <article className="my-5 flex w-full justify-center rounded-md shadow-inner">
                  <div className="max-h-[70vh] max-w-[88%] overflow-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="z-30 bg-gray-50">
                        <tr>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2"></th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2"></th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2"></th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2"></th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2"></th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2"></th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2"></th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2"></th>

                          {/* Subheadings for Deworming */}
                          <th className="sticky top-0 z-10 w-[35px] bg-gray-50 px-4" colSpan={2}>
                            Deworming
                          </th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2"></th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2"></th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2"></th>
                        </tr>

                        <tr>
                          <th className="sticky top-6 z-10 bg-gray-50 px-4 py-2"></th>
                          {/* <th className="px-4 py-2">ID</th> */}
                          <th className="sticky top-6 z-10 bg-gray-50 px-4 py-2">
                            <span className="group relative inline-block">
                              <button className={`${order === "petName" ? "underline" : ""}`} onClick={() => handleOrderFields("petName")}>
                                Name
                              </button>
                              <span className="absolute right-[-30px] top-full hidden w-[130px] whitespace-nowrap rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 shadow-sm group-hover:block">
                                Sort alphabetically
                              </span>
                            </span>
                          </th>
                          <th className="sticky top-6 z-10 bg-gray-50 px-4 py-2">Owner</th>

                          {/* <th className="px-4 py-2">Greater Area</th> */}
                          <th className="sticky top-6 z-10 bg-gray-50 px-4 py-2">Membership</th>
                          <th className="sticky top-6 z-10 bg-gray-50 px-4 py-2">Card Status</th>
                          <th className="sticky top-6 z-10 bg-gray-50 px-4 py-2">Area</th>
                          <th className="sticky top-6 z-10 bg-gray-50 px-4 py-2">
                            <span className="group relative inline-block">
                              <button className={`${order === "address" ? "underline" : ""}`} onClick={() => handleOrderFields("address")}>
                                Address
                              </button>
                              <span className="absolute right-[-30px] top-full hidden w-[130px] whitespace-nowrap rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 shadow-sm group-hover:block">
                                Sort alphabetically
                              </span>
                            </span>
                          </th>
                          <th className="sticky top-6 z-10 bg-gray-50 px-4 py-2">Pet Sterilised?</th>
                          <th className="sticky top-6 z-10 w-[35px] bg-gray-50 px-4 pb-2 pt-0">Last</th>
                          <th className="sticky top-6 z-10 w-[35px] bg-gray-50 px-4 pb-2 pt-0">Due?</th>
                          <th className="sticky top-6 z-10 w-[35px] bg-gray-50 px-4 py-2">Last Clinic</th>
                          {/* <th className="px-4 py-2">Last Treatment</th> */}
                          <th className="sticky top-6 z-10 w-[35px] bg-gray-50 px-4 py-2">
                            <span className="group relative inline-block">
                              <button className={`${order === "updatedAt" ? "underline" : ""}`} onClick={() => handleOrderFields("updatedAt")}>
                                Last Update
                              </button>
                              <span className="absolute right-[-20px] top-full hidden w-[110px] rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 shadow-sm group-hover:block">
                                Sort reverse chronologically
                              </span>
                            </span>
                          </th>
                          <th className="sticky top-6 z-10 bg-gray-50 px-4 py-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {pet_data_with_clinics_and_treatments?.map((pet, index) => {
                          return (
                            <tr className="items-center">
                              <td className=" border px-2 py-1">
                                <div className="flex justify-center">{index + 1}</div>
                              </td>
                              {/* <td className="border px-4 py-2">P{pet.petID}</td> */}
                              <td className="border px-2 py-1">
                                {pet.petName} ({pet.species === "Cat" ? "Cat" : pet.breed.join(", ")})
                              </td>
                              <td className="border px-2 py-1">
                                <div className="flex items-center justify-around">
                                  <button className="underline hover:text-blue-400" onClick={() => handleGoToOwnerProfile(pet.ownerID)}>
                                    {pet.owner.firstName} {pet.owner.surname}
                                  </button>
                                  <div className="relative flex items-center justify-center">
                                    <span className="group relative mx-[3px] my-3 flex items-center justify-center rounded-lg hover:bg-orange-200">
                                      <Dog
                                        size={24}
                                        className="block"
                                        onClick={() => handleAddNewPet(pet.owner.ownerID, pet.owner.firstName, pet.owner.surname)}
                                      />
                                      <span className="absolute bottom-full z-50 hidden w-[86px] rounded-md border border-gray-300 bg-white px-1 py-1 text-sm text-gray-700 shadow-sm group-hover:block">
                                        Add another pet to owner
                                      </span>
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* <td className="border px-2 py-1">{pet.owner.addressGreaterArea.greaterArea}</td> */}
                              <td className="border px-2 py-1">{pet.membership}</td>
                              <td className="border px-2 py-1">{pet.cardStatus}</td>
                              <td className="border px-2 py-1">{pet.owner.addressArea?.area ?? ""}</td>
                              <td className="border px-2 py-1">
                                {pet.owner.addressStreetNumber === 0 ? "" : pet.owner.addressStreetNumber} {pet.owner.addressStreet?.street ?? ""}
                              </td>
                              <td className="border px-2 py-1">
                                {pet.sterilisedStatus.getFullYear() === 1970
                                  ? "No"
                                  : "Yes, " +
                                    pet?.sterilisedStatus?.getDate().toString() +
                                    "/" +
                                    ((pet?.sterilisedStatus?.getMonth() ?? 0) + 1).toString() +
                                    "/" +
                                    pet?.sterilisedStatus?.getFullYear().toString()}
                              </td>
                              <td className="border px-2 py-1">
                                {pet?.lastDeworming?.getDate().toString() +
                                  "/" +
                                  ((pet?.lastDeworming?.getMonth() ?? 0) + 1).toString() +
                                  "/" +
                                  pet?.lastDeworming?.getFullYear().toString()}
                              </td>
                              <td className="border px-2 py-1">
                                {Number(pet?.lastDeworming) < Number(new Date().setMonth(new Date().getMonth() - (pet?.species == "Cat" ? 3 : 6)))
                                  ? "Yes"
                                  : "No"}
                              </td>

                              <td className="border px-2 py-1">
                                {pet.clinic_data && pet.clinic_data.length > 0 ? (
                                  <>
                                    {pet?.clinic_data?.[pet?.clinic_data.length - 1]?.clinic?.date.getDate().toString()}/
                                    {((pet?.clinic_data?.[pet?.clinic_data.length - 1]?.clinic?.date.getMonth() ?? 0) + 1).toString()}/
                                    {pet?.clinic_data?.[pet?.clinic_data.length - 1]?.clinic?.date.getFullYear().toString()}
                                  </>
                                ) : (
                                  "None"
                                )}
                              </td>

                              <td className="border px-2 py-1">
                                {pet?.updatedAt?.getDate()?.toString() ?? ""}
                                {"/"}
                                {((pet?.updatedAt?.getMonth() ?? 0) + 1)?.toString() ?? ""}
                                {"/"}
                                {pet?.updatedAt?.getFullYear()?.toString() ?? ""}
                              </td>
                              <div className="flex">
                                <div className="relative flex items-center justify-center">
                                  <span className="group relative mx-[5px] my-3 flex items-center justify-center rounded-lg hover:bg-orange-200">
                                    <Trash size={24} className="block" onClick={() => handleDeleteModal(pet.petID, String(pet.petID), pet.petName ?? "")} />
                                    <span className="absolute bottom-full z-50 hidden rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 shadow-sm group-hover:block">
                                      Delete pet
                                    </span>
                                  </span>
                                </div>

                                {recordBusy?.state && recordBusy?.record === pet.petID ? (
                                  <div className="justify center flex items-center">
                                    <div
                                      className="m-2 inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-current border-main-orange border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
                                      role="status"
                                    />
                                  </div>
                                ) : (
                                  <>
                                    <div className="relative flex items-center justify-center">
                                      <span className="group relative mx-[5px] my-3 flex items-center justify-center rounded-lg hover:bg-orange-200">
                                        <Pencil size={24} className="block" onClick={() => handleUpdateUserProfile(pet.petID)} />
                                        <span className="absolute bottom-full z-50 hidden rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 shadow-sm group-hover:block">
                                          Update pet
                                        </span>
                                      </span>
                                    </div>

                                    <div className="relative flex items-center justify-center">
                                      <span className="group relative mx-[5px] my-3 flex items-center justify-center rounded-lg hover:bg-orange-200">
                                        <AddressBook size={24} className="block" onClick={() => handleViewProfilePage(pet.petID)} />
                                        <span className="absolute bottom-full z-50 hidden w-[70px] rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 shadow-sm group-hover:block">
                                          View pet profile
                                        </span>
                                      </span>
                                    </div>
                                  </>
                                )}

                                {ownUser?.role != "General Data Capturer" && (
                                  <div className="relative flex items-center justify-center">
                                    <span className="group relative mx-[5px] my-3 flex items-center justify-center rounded-lg hover:bg-orange-200">
                                      <FirstAidKit size={24} className="block" onClick={() => handleCreateNewTreatment(pet.petID)} />
                                      <span className="absolute bottom-full z-50 hidden w-[82px] rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 shadow-sm group-hover:block">
                                        Create new treatment
                                      </span>
                                    </span>
                                  </div>
                                )}

                                <div className="relative flex items-center justify-center">
                                  <span className="group relative mx-[5px] my-3 mr-[31px] flex items-center justify-center rounded-lg hover:bg-orange-200">
                                    <Bed size={24} className="block" onClick={() => handleAddClinic(pet.petID)} />
                                    <span className="absolute bottom-full z-50 hidden w-[85px] rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 shadow-sm group-hover:block">
                                      Add today's clinic to pet
                                    </span>

                                    {showTodayClinics && petIDForClinic === pet.petID && (
                                      <>
                                        {isClinicLoading ? (
                                          <div
                                            className="mx-2 inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-current border-main-orange border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
                                            role="status"
                                          />
                                        ) : (
                                          <div
                                            ref={clinicRef}
                                            className="absolute right-0 top-0 z-10 w-44 divide-y divide-gray-100 rounded-lg bg-white shadow "
                                          >
                                            {/* <ul className="py-2 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdownHoverButton">
                                            {todayClinicList.map((option) => (
                                              <li key={option.id} onClick={() => handleAddTodaysClinic(pet.petID, option.id)}>
                                                <button className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">
                                                  {
                                                    //Give the date and in brackets the area
                                                    option.date + " (" + option.area + ")"
                                                  }
                                                </button>
                                              </li>
                                            ))}
                                          </ul> */}

                                            <ul className="rounded-lg border-2 border-black py-2 text-sm text-gray-700 " aria-labelledby="dropdownHoverButton">
                                              {todayClinicList.length > 0 ? (
                                                todayClinicList.map((option) => (
                                                  <li key={option.id} onClick={() => handleAddTodaysClinic(pet.petID, option.id)}>
                                                    <button className="block px-4 py-2 hover:bg-gray-100 ">
                                                      {
                                                        //Give the date and in brackets the area
                                                        option.date + " (" + option.area + ")"
                                                      }
                                                    </button>
                                                  </li>
                                                ))
                                              ) : (
                                                <li className="px-2">There are no clinics today</li>
                                              )}
                                            </ul>
                                          </div>
                                        )}
                                      </>
                                    )}
                                  </span>
                                </div>
                              </div>
                            </tr>
                          );
                        })}
                        <tr>
                          <td className=" px-2 py-1">
                            <div ref={observerTarget} />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </article>
              ) : (
                <div className="flex items-center justify-center pt-10">
                  <div
                    className="mx-2 inline-block h-24 w-24 animate-spin rounded-full border-8 border-solid border-current border-main-orange border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
                    role="status"
                  />
                </div>
              )}

              {/* <div ref={observerTarget} /> */}
            </div>
          </>
        )}
        {(isCreate || isUpdate) && (
          <>
            <div className="sticky z-50 flex justify-center md:top-[8.9%] xl:top-[11%] 3xl:top-[8.5%]">
              <div className="relative mb-4 flex grow flex-col items-center rounded-lg bg-slate-300 px-5 py-6">
                <b className=" text-2xl">{isUpdate ? "Update Pet Data" : "Add New Pet"}</b>
                <div className="flex justify-center">
                  <button className="absolute right-0 top-0 m-3 rounded-lg bg-main-orange p-3 text-white hover:bg-orange-500" onClick={handleBackButton}>
                    Back To Pet Table
                  </button>
                </div>
                <CreateButtonModal
                  isOpen={isCreateButtonModalOpen}
                  mandatoryFields={mandatoryFields}
                  errorFields={errorFields}
                  onClose={() => setIsCreateButtonModalOpen(false)}
                />
                <TreatmentModal
                  isOpen={isTreatmentModalOpen}
                  onClose={() => setIsTreatmentModalOpen(false)}
                  treatment={treatmentModal ?? { treatmentID: 0, category: "", type: [""], date: "", comments: "" }}
                />
              </div>
            </div>
            <div className="flex grow flex-col items-center">
              <label>
                {"("}All fields marked <span className="px-1 text-lg text-main-orange"> * </span> are compulsary{")"}
              </label>
              <div className="flex w-[47%] flex-col items-start">
                {/*<div className="p-2">User ID: {(lastUserCreated?.data?.userID ?? 1000000) + 1}</div>*/}
                <div className="relative my-2 flex w-full flex-col rounded-lg border-2 bg-slate-200 p-4">
                  <b className="mb-3 text-center text-xl">Pet Identification Data</b>
                  {isUpdate && (
                    <div className={`absolute ${user?.image ? "right-12" : "right-8"} top-16`}>
                      {user?.image ? (
                        <Image src={user?.image} alt="Afripaw profile pic" className="ml-auto aspect-auto max-h-40 max-w-[7rem]" width={140} height={160} />
                      ) : (
                        <>
                          <UserCircle size={140} className="ml-auto aspect-auto max-h-52 max-w-[9rem] border-2" />
                          {isDoneUploading && <div className="absolute top-32 z-10 text-sm text-green-600">(Done uploading. Image will appear soon)</div>}
                        </>
                      )}
                    </div>
                  )}
                  {isUpdate && (
                    <UploadButton
                      className="absolute right-8 top-60 ut-button:bg-main-orange ut-button:focus:bg-orange-500 ut-button:active:bg-orange-500 ut-button:disabled:bg-orange-500 ut-label:hover:bg-orange-500"
                      endpoint="imageUploader"
                      input={{ userId: String(user?.petID) ?? "", user: "pet" }}
                      onUploadError={(error: Error) => {
                        // Do something with the error.
                        alert(`ERROR! ${error.message}`);
                      }}
                      onClientUploadComplete={() => {
                        setIsDoneUploading(true);
                        // void user.refetch();
                      }}
                    />
                  )}
                  <div className="flex py-2">
                    Pet ID: <div className="px-3">P{isCreate ? String((latestPetID?.data?.petID ?? 0) + 1) : id}</div>
                  </div>
                  <Input label="Pet Name" placeholder="Type here: e.g. Sally" value={petName} onChange={setPetName} required />
                  {petNameErrorMessage && <div className="text-sm text-red-500">{petNameErrorMessage}</div>}

                  <div className="flex items-start">
                    <div className="mr-3 flex items-center pt-4">
                      <label>
                        Species<span className="text-lg text-main-orange">*</span>:{" "}
                      </label>
                    </div>
                    <div className="flex flex-col">
                      <button
                        ref={btnSpeciesRef}
                        className="my-3 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300 "
                        type="button"
                        onClick={handleToggleSpecies}
                      >
                        {speciesOption + " "}
                        <svg className="ms-3 h-2.5 w-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                        </svg>
                      </button>
                      {isSpeciesOpen && (
                        <div ref={speciesRef} className="z-10 w-44 divide-y divide-gray-100 rounded-lg bg-white shadow ">
                          <ul className="py-2 text-sm text-gray-700 " aria-labelledby="dropdownHoverButton">
                            {speciesOptions.map((option) => (
                              <li key={option} onClick={() => handleSpeciesOption(option)}>
                                <button className="block px-4 py-2 hover:bg-gray-100 ">{option}</button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="mr-3 flex items-center pt-4">
                      <label>
                        Sex<span className="text-lg text-main-orange">*</span>:{" "}
                      </label>
                    </div>
                    <div className="flex flex-col">
                      <button
                        ref={btnSexRef}
                        className="my-3 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300 "
                        type="button"
                        onClick={handleToggleSex}
                      >
                        {sexOption + " "}
                        <svg className="ms-3 h-2.5 w-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                        </svg>
                      </button>
                      {isSexOpen && (
                        <div ref={sexRef} className="z-10 w-44 divide-y divide-gray-100 rounded-lg bg-white shadow ">
                          <ul className="py-2 text-sm text-gray-700 " aria-labelledby="dropdownHoverButton">
                            {sexOptions.map((option) => (
                              <li key={option} onClick={() => handleSexOption(option)}>
                                <button className="block px-4 py-2 hover:bg-gray-100 ">{option}</button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="mr-3 flex items-center pt-4">
                      <label>
                        Age Category<span className="text-lg text-main-orange">*</span>:{" "}
                      </label>
                    </div>
                    <div className="flex flex-col">
                      <button
                        ref={btnAgeRef}
                        className="my-3 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300 "
                        type="button"
                        onClick={handleToggleAge}
                      >
                        {/* {ageOption === "Select one" ? user?.age : ageOption + " "} */}
                        {ageOption + " "}
                        <svg className="ms-3 h-2.5 w-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                        </svg>
                      </button>
                      {isAgeOpen && (
                        <div ref={ageRef} className="z-10 w-44 divide-y divide-gray-100 rounded-lg bg-white shadow ">
                          <ul className="py-2 text-sm text-gray-700 " aria-labelledby="dropdownHoverButton">
                            {ageOptions.map((option) => (
                              <li key={option} onClick={() => handleAgeOption(option)}>
                                <button className="block px-4 py-2 hover:bg-gray-100 ">{option}</button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* 
                  <div className="flex items-start">
                    <div className="mr-3 flex items-center pt-4">
                      <label>
                        Breed<span className="text-lg text-main-orange">*</span>:{" "}
                      </label>
                    </div>
                    <div className="flex flex-col">
                      <button
                        ref={btnBreedRef}
                        className="my-3 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                        type="button"
                        onClick={handleToggleBreed}
                      >
                        {breedOption + " "}
                        <svg className="ms-3 h-2.5 w-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                        </svg>
                      </button>
                      {isBreedOpen && (
                        <div ref={breedRef} className="z-10 w-44 divide-y divide-gray-100 rounded-lg bg-white shadow dark:bg-gray-700">
                          <ul className="py-2 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdownHoverButton">
                            {breedOptions.map((option) => (
                              <li key={option} onClick={() => handleBreedOption(option)}>
                                <button className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">{option}</button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div> */}

                  {speciesOption === "Dog" && (
                    <div className="flex items-start">
                      <div className="mr-3 flex items-center pt-5">
                        <div className=" flex">
                          Breed(s)<span className="text-lg text-main-orange">*</span>:{" "}
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <button
                          ref={btnBreedRef}
                          className="my-3 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300 "
                          type="button"
                          onClick={handleToggleBreed}
                        >
                          {breedOption + " "}
                          <svg className="ms-3 h-2.5 w-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                          </svg>
                        </button>
                        {isBreedOpen && (
                          <div ref={breedRef} className="z-10 w-44 divide-y divide-gray-100 rounded-lg bg-white shadow ">
                            {/* <ul className="py-2 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdownHoverButton">
                            {colourOptions.map((option) => (
                              <li key={option} onClick={() => handleColourOption(option)}>
                                <button className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">{option}</button>
                              </li>
                            ))}
                          </ul> */}
                            <ul className="py-2 text-sm text-gray-700 " aria-labelledby="dropdownHoverButton">
                              <li key={1}>
                                <div className="flex items-center px-4">
                                  <input
                                    id="1"
                                    type="checkbox"
                                    checked={breedSelection?.allSelected}
                                    onChange={(e) => handleBreed("", e.target.checked, "allSelected")}
                                    className="h-4 w-4 rounded bg-gray-100 text-main-orange accent-main-orange focus:ring-2"
                                  />
                                  <label htmlFor="1" className="ms-2 text-sm font-bold text-gray-900">
                                    Select All
                                  </label>
                                </div>
                              </li>
                              <li key={2}>
                                <div className="flex items-center px-4">
                                  <input
                                    id="2"
                                    type="checkbox"
                                    checked={breedSelection?.clear}
                                    onChange={(e) => handleBreed("", e.target.checked, "clear")}
                                    className="h-4 w-4 rounded bg-gray-100 text-main-orange accent-main-orange focus:ring-2"
                                  />
                                  <label htmlFor="2" className="ms-2 text-sm font-bold text-gray-900">
                                    Clear All
                                  </label>
                                </div>
                              </li>
                              {breedListOptions?.map((option) => (
                                <li key={option.breed}>
                                  <div className="flex items-center px-4">
                                    <input
                                      id={String(option.breed)}
                                      type="checkbox"
                                      checked={option.state}
                                      onChange={(e) => handleBreed(option.breed, e.target.checked, "normal")}
                                      className="h-4 w-4 rounded bg-gray-100 text-main-orange accent-main-orange focus:ring-2"
                                    />
                                    <label htmlFor={String(option.breed)} className="ms-2 text-sm font-medium text-gray-900">
                                      {option.breed}
                                    </label>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-start">
                    <div className="mr-3 flex items-center pt-5">
                      <div className=" flex">Colour(s): </div>
                    </div>
                    <div className="flex flex-col">
                      <button
                        ref={btnColourRef}
                        className="my-3 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300 "
                        type="button"
                        onClick={handleToggleColour}
                      >
                        {colourOption + " "}
                        <svg className="ms-3 h-2.5 w-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                        </svg>
                      </button>
                      {isColourOpen && (
                        <div ref={colourRef} className="z-10 w-44 divide-y divide-gray-100 rounded-lg bg-white shadow ">
                          {/* <ul className="py-2 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdownHoverButton">
                            {colourOptions.map((option) => (
                              <li key={option} onClick={() => handleColourOption(option)}>
                                <button className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">{option}</button>
                              </li>
                            ))}
                          </ul> */}
                          <ul className="py-2 text-sm text-gray-700 " aria-labelledby="dropdownHoverButton">
                            <li key={1}>
                              <div className="flex items-center px-4">
                                <input
                                  id="1"
                                  type="checkbox"
                                  checked={colourSelection?.allSelected}
                                  onChange={(e) => handleColour("", e.target.checked, "allSelected")}
                                  className="h-4 w-4 rounded bg-gray-100 text-main-orange accent-main-orange focus:ring-2"
                                />
                                <label htmlFor="1" className="ms-2 text-sm font-bold text-gray-900">
                                  Select All
                                </label>
                              </div>
                            </li>
                            <li key={2}>
                              <div className="flex items-center px-4">
                                <input
                                  id="2"
                                  type="checkbox"
                                  checked={colourSelection?.clear}
                                  onChange={(e) => handleColour("", e.target.checked, "clear")}
                                  className="h-4 w-4 rounded bg-gray-100 text-main-orange accent-main-orange focus:ring-2"
                                />
                                <label htmlFor="2" className="ms-2 text-sm font-bold text-gray-900">
                                  Clear All
                                </label>
                              </div>
                            </li>
                            {colourListOptions?.map((option) => (
                              <li key={option.colour}>
                                <div className="flex items-center px-4">
                                  <input
                                    id={String(option.colour)}
                                    type="checkbox"
                                    checked={option.state}
                                    onChange={(e) => handleColour(option.colour, e.target.checked, "normal")}
                                    className="h-4 w-4 rounded bg-gray-100 text-main-orange accent-main-orange focus:ring-2"
                                  />
                                  <label htmlFor={String(option.colour)} className="ms-2 text-sm font-medium text-gray-900">
                                    {option.colour}
                                  </label>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  {speciesOption === "Dog" && (
                    <div className="flex items-start">
                      <div className="mr-3 flex items-center pt-4">
                        <label>Size: </label>
                      </div>
                      <div className="flex flex-col">
                        <button
                          ref={btnSizeRef}
                          className="my-3 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300 "
                          type="button"
                          onClick={handleToggleSize}
                        >
                          {sizeOption + " "}
                          <svg className="ms-3 h-2.5 w-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                          </svg>
                        </button>
                        {size && (
                          <div ref={sizeRef} className="z-10 w-44 divide-y divide-gray-100 rounded-lg bg-white shadow ">
                            <ul className="py-2 text-sm text-gray-700 " aria-labelledby="dropdownHoverButton">
                              {sizeOptions.map((option) => (
                                <li key={option} onClick={() => handleSizeOption(option)}>
                                  <button className="block px-4 py-2 hover:bg-gray-100 ">{option}</button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-start">
                    <div className="w-36 pt-3">Markings: </div>

                    <textarea
                      className="m-2 h-24 w-full rounded-lg border-2 border-slate-300 px-2 focus:border-black"
                      placeholder="Type here: e.g. White fur with dark spot on the left side of the face"
                      onChange={(e) => setMarkings(e.target.value)}
                      value={markings}
                    />
                  </div>

                  {isUpdate ? (
                    <div className="mt-3 flex items-start">
                      <div className="mr-3">Owner: </div>
                      <div>
                        {firstName} {surname} (N{ownerID})
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 flex items-start">
                      <div className="mr-3">Owner: </div>
                      <div>
                        {firstName} {surname} (N{ownerID})
                        {/* {(router.asPath.split("?")[1] ?? "")?.split("&")[1]?.split("=")[1]} {(router.asPath.split("?")[1] ?? "")?.split("&")[2]?.split("=")[1]}{" "}
                        (N{(router.asPath.split("?")[1] ?? "")?.split("&")[0]?.split("=")[1]}) */}
                      </div>
                    </div>
                  )}
                </div>

                <div className="my-2 flex w-full flex-col rounded-lg border-2 bg-slate-200 p-4">
                  <b className="mb-3 text-center text-xl">Pet Health Data</b>

                  <div className="flex items-start">
                    <div className="mr-3 flex items-center pt-4">
                      <label>
                        Pet Status<span className="text-lg text-main-orange">*</span>:{" "}
                      </label>
                    </div>
                    <div className="flex flex-col">
                      <button
                        ref={btnStatusRef}
                        className="my-3 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300"
                        type="button"
                        onClick={handleToggleStatus}
                      >
                        {statusOption + " "}
                        <svg className="ms-3 h-2.5 w-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                        </svg>
                      </button>
                      {status && (
                        <div ref={statusRef} className="z-10 w-44 divide-y divide-gray-100 rounded-lg bg-white shadow">
                          <ul className="py-2 text-sm text-gray-700 " aria-labelledby="dropdownHoverButton">
                            {statusOptions.map((option) => (
                              <li key={option} onClick={() => handleStatusOption(option)}>
                                <button className="block px-4 py-2 hover:bg-gray-100 ">{option}</button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="mr-3 flex items-center pt-4">
                      <label>
                        Sterilised?<span className="text-lg text-main-orange">*</span>:{" "}
                      </label>
                    </div>
                    <div className="flex flex-col">
                      <button
                        ref={btnSterilisationStatusRef}
                        className="my-3 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300"
                        type="button"
                        onClick={handleToggleSterilisationStatus}
                      >
                        {sterilisationStatusOption + " "}
                        <svg className="ms-3 h-2.5 w-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                        </svg>
                      </button>
                      {sterilisationStatus && (
                        <div ref={sterilisationStatusRef} className="z-10 w-44 divide-y divide-gray-100 rounded-lg bg-white shadow ">
                          <ul className="py-2 text-sm text-gray-700 " aria-labelledby="dropdownHoverButton">
                            {sterilisationStatusOptions.map((option) => (
                              <li key={option} onClick={() => handleSterilisationStatusOption(option)}>
                                <button className="block px-4 py-2 hover:bg-gray-100">{option}</button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    {sterilisationStatusOption === "Yes" && (
                      <div className="flex items-start">
                        <div className="mr-3 flex items-center pt-5">
                          <div className=" flex pl-3">Sterilisation Date: </div>
                        </div>
                        <div className=" pt-2">
                          <DatePicker
                            selected={sterilisationStatusDate}
                            onChange={(date) => setSterilisationStatusDate(date!)}
                            dateFormat="dd/MM/yyyy"
                            customInput={<CustomSterilisationStatusInput />}
                            className="form-input z-30 rounded-md border py-2"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {sterilisationStatusOption === "No" && (
                    <div className="flex items-start">
                      <div className="mr-3 flex items-center pt-5">
                        <div className=" flex">Sterilisation Requested?: </div>
                      </div>
                      <div className="flex flex-col">
                        <button
                          ref={btnSterilisationRequestedRef}
                          className="my-3 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300"
                          type="button"
                          onClick={handleToggleSterilisationRequested}
                        >
                          {sterilisationRequestedOption + " "}
                          <svg className="ms-3 h-2.5 w-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                          </svg>
                        </button>
                        {sterilisationRequested && (
                          <div ref={sterilisationRequestedRef} className="z-10 w-44 divide-y divide-gray-100 rounded-lg bg-white shadow">
                            <ul className="py-2 text-sm text-gray-700 " aria-labelledby="dropdownHoverButton">
                              {sterilisationRequestedOptions.map((option) => (
                                <li key={option} onClick={() => handleSterilisationRequestedOption(option)}>
                                  <button className="block px-4 py-2 hover:bg-gray-100 ">{option}</button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      {sterilisationRequestedOption === "Yes" && (
                        <div className="flex items-start">
                          <div className="mr-3 flex items-center pt-5">
                            <div className=" flex pl-3">Sterilisation Requested Date: </div>
                          </div>
                          <div className=" pt-2">
                            <DatePicker
                              selected={sterilisationRequestedDate}
                              onChange={(date) => setSterilisationRequestedDate(date!)}
                              dateFormat="dd/MM/yyyy"
                              customInput={<CustomSterilisationRequestedInput />}
                              className="form-input z-30 rounded-md border py-2"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {sterilisationRequestedOption === "Yes" && sterilisationStatusOption === "No" && (
                    <div className="flex items-start">
                      <div className="mr-3 flex items-center pt-5">
                        <div className=" flex">Sterilisation Request Signed At: </div>
                      </div>
                      <div className="flex flex-col">
                        <button
                          ref={btnSterilisationRequestSignedRef}
                          className="my-3 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300"
                          type="button"
                          onClick={handleToggleSterilisationRequestSigned}
                        >
                          {sterilisationRequestSignedOption + " "}
                          <svg className="ms-3 h-2.5 w-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                          </svg>
                        </button>
                        {sterilisationRequestSigned && (
                          <div ref={sterilisationRequestSignedRef} className="z-10 w-44 divide-y divide-gray-100 rounded-lg bg-white shadow ">
                            <ul className="py-2 text-sm text-gray-700 " aria-labelledby="dropdownHoverButton">
                              {sterilisationRequestSignedOptions.map((option) => (
                                <li key={option} onClick={() => handleSterilisationRequestSignedOption(option)}>
                                  <button className="block px-4 py-2 hover:bg-gray-100">{option}</button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {sterilisationRequestedOption === "Yes" && sterilisationRequestSignedOption != "Select one" && sterilisationStatusOption === "No" && (
                    <div className="flex items-start">
                      <div className="mr-3 flex items-center pt-5">
                        <div className=" flex">Sterilisation Outcome: </div>
                      </div>
                      <div className="flex flex-col">
                        <button
                          ref={btnSterilisationOutcomeRef}
                          className="my-3 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300 "
                          type="button"
                          onClick={handleToggleSterilisationOutcome}
                        >
                          {sterilisationOutcomeOption + " "}
                          <svg className="ms-3 h-2.5 w-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                          </svg>
                        </button>
                        {sterilisationOutcome && (
                          <div ref={sterilisationOutcomeRef} className="z-10 w-44 divide-y divide-gray-100 rounded-lg bg-white shadow ">
                            <ul className="py-2 text-sm text-gray-700 " aria-labelledby="dropdownHoverButton">
                              {sterilisationOutcomeOptions.map((option) => (
                                <li key={option} onClick={() => handleSterilisationOutcomeOption(option)}>
                                  <button className="block px-4 py-2 hover:bg-gray-100 ">{option}</button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      {(sterilisationOutcomeOption === "Actioned" || sterilisationOutcomeOption === "No show" || sterilisationOutcomeOption === "No Show") && (
                        <div className="flex items-start">
                          <div className="mr-3 flex items-center pt-5">
                            <div className=" flex pl-3">Sterilisation Outcome Date: </div>
                          </div>
                          <div className=" pt-2">
                            <DatePicker
                              selected={sterilisationOutcomeDate}
                              onChange={(date) => setSterilisationOutcomeDate(date!)}
                              dateFormat="dd/MM/yyyy"
                              customInput={<CustomSterilisationOutcomeInput />}
                              className="form-input z-30 rounded-md border py-2"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-start">
                    <div className="mr-3 flex items-center pt-4">
                      <label>
                        Vaccination Shot 1<span className="text-lg text-main-orange">*</span>:{" "}
                      </label>
                    </div>
                    <div className="flex flex-col">
                      <button
                        ref={btnVaccinationShot1Ref}
                        className="my-3 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300 "
                        type="button"
                        onClick={handleToggleVaccinationShot1}
                      >
                        {vaccinationShot1Option == "" ? "Select one" : vaccinationShot1Option + " "}
                        <svg className="ms-3 h-2.5 w-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                        </svg>
                      </button>
                      {vaccinationShot1 && (
                        <div ref={vaccinationShot1Ref} className="z-10 w-44 divide-y divide-gray-100 rounded-lg bg-white shadow ">
                          <ul className="py-2 text-sm text-gray-700 " aria-labelledby="dropdownHoverButton">
                            {vaccinationShot1Options.map((option) => (
                              <li key={option} onClick={() => handleVaccinationShot1Option(option)}>
                                <button className="block px-4 py-2 hover:bg-gray-100 ">{option}</button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    {vaccinationShot1Option === "Yes" && (
                      <div className="flex items-start">
                        <div className="mr-3 flex items-center pt-5">
                          <div className=" flex pl-3">Vaccination Shot 1 Date: </div>
                        </div>
                        <div className="z-20 pt-2">
                          <DatePicker
                            selected={vaccinationShot1Date}
                            onChange={(date) => setVaccinationShot1Date(date!)}
                            dateFormat="dd/MM/yyyy"
                            customInput={<CustomVaccine1Input />}
                            className="form-input rounded-md border py-2"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {vaccinationShot1Option === "Yes" && (
                    <div className="flex items-start">
                      <div className="mr-3 flex items-center pt-5">
                        <div className=" flex">Vaccination Shot 2: </div>
                      </div>
                      <div className="flex flex-col">
                        <button
                          ref={btnVaccinationShot2Ref}
                          className="my-3 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300"
                          type="button"
                          onClick={handleToggleVaccinationShot2}
                        >
                          {vaccinationShot2Option == "" ? "Select one" : vaccinationShot2Option + " "}
                          <svg className="ms-3 h-2.5 w-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                          </svg>
                        </button>
                        {vaccinationShot2 && (
                          <div ref={vaccinationShot2Ref} className="z-10 w-44 divide-y divide-gray-100 rounded-lg bg-white shadow ">
                            <ul className="py-2 text-sm text-gray-700" aria-labelledby="dropdownHoverButton">
                              {vaccinationShot2Options.map((option) => (
                                <li key={option} onClick={() => handleVaccinationShot2Option(option)}>
                                  <button className="block px-4 py-2 hover:bg-gray-100 ">{option}</button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      {vaccinationShot2Option === "Yes" && (
                        <div className="flex items-start">
                          <div className="mr-3 flex items-center pt-5">
                            <div className=" flex pl-3">Vaccination Shot 2 Date: </div>
                          </div>
                          <div className="z-10 pt-2">
                            <DatePicker
                              selected={vaccinationShot2Date}
                              onChange={(date) => setVaccinationShot2Date(date!)}
                              dateFormat="dd/MM/yyyy"
                              customInput={<CustomVaccine2Input />}
                              className="form-input rounded-md border py-2"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {vaccinationShot2Option === "Yes" && vaccinationShot1Option === "Yes" && (
                    <div className="flex items-start">
                      <div className="mr-3 flex items-center pt-5">
                        <div className=" flex">Vaccination Shot 3: </div>
                      </div>
                      <div className="flex flex-col">
                        <button
                          ref={btnVaccinationShot3Ref}
                          className="my-3 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300"
                          type="button"
                          onClick={handleToggleVaccinationShot3}
                        >
                          {vaccinationShot3Option == "" ? "Select one" : vaccinationShot3Option + " "}
                          <svg className="ms-3 h-2.5 w-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                          </svg>
                        </button>
                        {vaccinationShot3 && (
                          <div ref={vaccinationShot3Ref} className="z-10 w-44 divide-y divide-gray-100 rounded-lg bg-white shadow">
                            <ul className="py-2 text-sm text-gray-700 " aria-labelledby="dropdownHoverButton">
                              {vaccinationShot3Options.map((option) => (
                                <li key={option} onClick={() => handleVaccinationShot3Option(option)}>
                                  <button className="block px-4 py-2 hover:bg-gray-100">{option}</button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      {vaccinationShot3Option === "Yes" && (
                        <div className="flex items-start">
                          <div className="mr-3 flex items-center pt-5">
                            <div className=" flex pl-3">Vaccination Shot 3 Date: </div>
                          </div>
                          <div className="z-0 pt-2">
                            <DatePicker
                              selected={vaccinationShot3Date}
                              onChange={(date) => setVaccinationShot3Date(date!)}
                              dateFormat="dd/MM/yyyy"
                              customInput={<CustomVaccine3Input />}
                              className="form-input rounded-md border py-2"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {isUpdate && treatmentList.length > 0 && ownUser?.role != "General Data Capturer" && (
                    // <div className="flex items-start">
                    //   <div className="mr-3 flex items-center pt-5">
                    //     <div className=" flex">Treatments: </div>
                    //   </div>
                    //   <div className="mt-5 flex">{treatmentList.map((treatment) => treatment.type + " (" + treatment.category + ")").join(", ")}</div>
                    // </div>
                    <div className="mb-2 flex items-start">
                      <div className="mr-3">Treatment(s):</div>{" "}
                      <div className="flex flex-col items-start">
                        {treatmentList.map((treatment) => (
                          <button
                            key={treatment?.treatmentID}
                            className="underline hover:text-blue-400"
                            onClick={() =>
                              handleTreatmentModal(treatment?.treatmentID, treatment?.category, treatment?.type, treatment?.date, treatment?.comments)
                            }
                          >
                            {treatment.date.toString() + " " + treatment?.type.join(", ") + " (" + (treatment?.category ?? "") + ")"}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="my-2 flex w-full flex-col rounded-lg border-2 bg-slate-200 p-4">
                  <b className="mb-3 text-center text-xl">AfriPaw Association Data</b>

                  {/*Clinics attended*/}
                  <div className="flex items-start">
                    <div className="mr-3 flex items-center pt-5">
                      <div className=" flex">Clinic(s) Attended: </div>
                    </div>
                    {/*Show list of all the clinics attended */}
                    {/* <div className="flex flex-col items-center">
                      <button
                        onClick={handleShowClinicsAttended}
                        className="mb-2 mr-3 mt-3 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                      >
                        Show all clinics attended
                      </button>
                      {showClinicsAttended && (
                        <ul className="mr-3 w-full rounded-lg bg-white px-5 py-2 text-sm text-gray-700 dark:text-gray-200">
                          {clinicList.map((clinic) => (
                            <li key={clinic.id} className=" py-2">
                              {clinic.date + " (" + clinic.area + ")"}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div> */}

                    <div className="flex flex-col">
                      <button
                        ref={btnClinicsAttendedRef}
                        className="my-3 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300 "
                        type="button"
                        onClick={handleToggleClinicsAttended}
                      >
                        {clinicsAttendedOption + " "}
                        <svg className="ms-3 h-2.5 w-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                        </svg>
                      </button>
                      {clinicsAttended && (
                        <div ref={clinicsAttendedRef} className="z-10 divide-y divide-gray-100 rounded-lg bg-white shadow ">
                          <ul className="w-52 py-2 text-sm text-gray-700 " aria-labelledby="dropdownHoverButton">
                            <li key={1}>
                              <div className="flex items-center px-4">
                                <input
                                  id="1"
                                  type="checkbox"
                                  checked={clinicSelection?.allSelected}
                                  onChange={(e) => handleClinicsAttended(0, "", "", e.target.checked, "allSelected")}
                                  className="h-4 w-4 rounded bg-gray-100 text-main-orange accent-main-orange focus:ring-2"
                                />
                                <label htmlFor="1" className="ms-2 text-sm font-bold text-gray-900">
                                  Select All
                                </label>
                              </div>
                            </li>
                            <li key={2}>
                              <div className="flex items-center px-4">
                                <input
                                  id="2"
                                  type="checkbox"
                                  checked={clinicSelection?.clear}
                                  onChange={(e) => handleClinicsAttended(0, "", "", e.target.checked, "clear")}
                                  className="h-4 w-4 rounded bg-gray-100 text-main-orange accent-main-orange focus:ring-2"
                                />
                                <label htmlFor="2" className="ms-2 text-sm font-bold text-gray-900">
                                  Clear All
                                </label>
                              </div>
                            </li>
                            {clinicListOptions?.map((option) => (
                              <li key={option.id}>
                                <div className="flex items-center px-4">
                                  <input
                                    id={String(option.id)}
                                    type="checkbox"
                                    checked={option.state}
                                    onChange={(e) => handleClinicsAttended(option.id, option.area, option.date, e.target.checked, "normal")}
                                    className="h-4 w-4 rounded bg-gray-100 text-main-orange accent-main-orange focus:ring-2"
                                  />
                                  <label htmlFor={String(option.id)} className="ms-2 text-sm font-medium text-gray-900">
                                    {option.date.toString()} {option.area}
                                  </label>
                                </div>
                              </li>
                            ))}
                          </ul>
                          {/* <ul className="w-full rounded-lg bg-white px-2 py-2 text-gray-700 dark:text-gray-200" aria-labelledby="dropdownHoverButton">
                            {clinicsAttendedOptions.map((option) => (
                              <li
                                key={option.clinicID}
                                onClick={() =>
                                  handleClinicsAttendedOption(
                                    option.clinicID,
                                    option.date.getDate().toString() +
                                      "/" +
                                      ((option.date.getMonth() ?? 0) + 1).toString() +
                                      "/" +
                                      option.date.getFullYear().toString(),
                                    option.area.area,
                                  )
                                }
                              >
                                <button className="block w-48 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">
                                  {option.date.getDate().toString() +
                                    "/" +
                                    ((option.date.getMonth() ?? 0) + 1).toString() +
                                    "/" +
                                    option.date.getFullYear().toString() +
                                    " " +
                                    option.area.area}
                                </button>
                              </li>
                            ))}
                          </ul> */}
                        </div>
                      )}
                    </div>

                    {/* {showClinicMessage && <div className="ml-2 mt-5 text-red-600">(Veterinary fees covered)</div>} */}
                  </div>

                  {/*LAST DEWORMING*/}

                  <div className="flex items-center">
                    <label>
                      Last Deworming<span className="text-lg text-main-orange">*</span>:{" "}
                    </label>
                    <div className="py-4">
                      <DatePicker
                        selected={lastDeworming}
                        onChange={(date) => setLastDeworming(date!)}
                        dateFormat="dd/MM/yyyy"
                        customInput={<CustomInput />}
                        className="form-input rounded-md border px-3 py-2"
                      />
                    </div>

                    {lastDeworming && isMoreThanSixMonthsAgo(lastDeworming) && <div className="text-red-600">(Due for deworming)</div>}
                    {lastDeworming && isMoreThanSixMonthsAgo(lastDeworming) && (
                      <div className="group relative mx-[5px] flex items-center justify-center rounded-lg hover:bg-orange-200">
                        <Info size={24} className="block" />
                        <span className="absolute left-[90%] top-[90%] z-20 hidden w-[12rem] rounded-md border border-black bg-white px-2 py-1 text-sm text-gray-700 shadow-sm group-hover:block">
                          A dog is due for deworming if its last deworming was more than 6 months ago. A cat is due for deworming if its last deworming was more
                          than 3 months ago.
                        </span>
                      </div>
                    )}
                  </div>

                  {/* <div className="flex items-start">
                    <div className="mr-3 flex items-center pt-5">
                      <div className=" flex">14. Last Deworming: </div>
                    </div>
                    <div className="flex flex-col">
                      <button
                        ref={btnLastDewormingRef}
                        className="my-3 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                        type="button"
                        onClick={handleToggleLastDeworming}
                      >
                        {lastDewormingOption + " "}
                        <svg className="ms-3 h-2.5 w-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                        </svg>
                      </button>
                      {lastDeworming && (
                        <div ref={lastDewormingRef} className="z-10 w-44 divide-y divide-gray-100 rounded-lg bg-white shadow dark:bg-gray-700">
                          <ul className="py-2 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdownHoverButton">
                            {clinicDates.map((option) => (
                              <li key={option} onClick={() => handleLastDewormingOption(option)}>
                                <button className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">{option}</button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div> */}

                  <div className="flex items-start">
                    <div className="mr-3 flex items-center pt-4">
                      <label>
                        Membership Type<span className="text-lg text-main-orange">*</span>:{" "}
                      </label>
                    </div>
                    <div className="flex flex-col">
                      <button
                        ref={btnMembershipTypeRef}
                        className="my-3 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300 "
                        type="button"
                        onClick={handleToggleMembershipType}
                      >
                        {membershipTypeOption + " "}
                        <svg className="ms-3 h-2.5 w-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                        </svg>
                      </button>
                      {membershipType && (
                        <div ref={membershipTypeRef} className="z-10 w-44 divide-y divide-gray-100 rounded-lg bg-white shadow ">
                          <ul className="py-2 text-sm text-gray-700" aria-labelledby="dropdownHoverButton">
                            {membershipTypeOptions.map((option) => (
                              <li key={option} onClick={() => handleMembershipTypeOption(option)}>
                                <button className="block px-4 py-2 hover:bg-gray-100 ">{option}</button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {(membershipTypeOption === "Standard card holder" ||
                      membershipTypeOption === "Gold card holder" ||
                      membershipTypeOption === "Standard Card Holder" ||
                      membershipTypeOption === "Gold Card Holder") && (
                      <div className="flex items-start">
                        <div className="mr-3 flex items-center pt-5">
                          <div className=" flex pl-3">Membership Date: </div>
                        </div>
                        <div className=" pt-2">
                          <DatePicker
                            selected={membershipDate}
                            onChange={(date) => setMembershipDate(date!)}
                            dateFormat="dd/MM/yyyy"
                            customInput={<CustomMembershipInput />}
                            className="form-input z-30 rounded-md border py-2"
                          />
                        </div>
                      </div>
                    )}

                    {/* {membershipTypeOption !== "Non-card holder" &&
                      (membershipStatus() === "(Lapsed)" ? (
                        <div className="pl-4 pt-5 text-red-600">{membershipStatus()}</div>
                      ) : (
                        <div className="pl-4 pt-5 text-black">{membershipStatus()}</div>
                      ))} */}
                    {/* {membershipTypeOption !== "Non-card holder" && membershipStatus() !== "" && (
                      <div className="group relative mx-[5px] mt-5 flex items-center justify-center rounded-lg hover:bg-orange-200">
                        <Info size={24} className="block" />
                        <span className="absolute left-[90%] top-[90%] hidden w-[17rem] rounded-md border border-black bg-white px-2 py-1 text-sm text-gray-700 shadow-sm group-hover:block">
                          The status of a card holder lapses if the pet has not attended a pet clinic for 3 months in a row. A lapsed card holder can become
                          active again upon having attended at least 3 out of any 6 pet clinics following the lapse.
                        </span>
                      </div>
                    )} */}
                  </div>

                  {/* membershipTypeOption !== "Non-card holder" && membershipTypeOption !== "Select one" */}
                  {(membershipTypeOption === "Standard card holder" ||
                    membershipTypeOption === "Gold card holder" ||
                    membershipTypeOption === "Standard Card Holder" ||
                    membershipTypeOption === "Gold Card Holder") && (
                    <>
                      <div className="my-5 flex items-start">
                        <div className="mr-3 flex items-center">
                          <div className=" flex">Membership Status: </div>
                        </div>
                        {membershipStatus().slice(1, membershipStatus().length - 1) === "" ? (
                          <span className=" text-black">Not Applicable</span>
                        ) : membershipStatus().slice(1, membershipStatus().length - 1) === "Lapsed" ? (
                          <span className=" text-red-600">{membershipStatus().slice(1, membershipStatus().length - 1)}</span>
                        ) : (
                          <span className=" text-black">{membershipStatus().slice(1, membershipStatus().length - 1)}</span>
                        )}
                        {/* {membershipStatus() !== "" && ( */}
                        <div className="group relative mx-[5px] flex items-center justify-center rounded-lg hover:bg-orange-200">
                          <Info size={24} className="block" />
                          <span className="absolute left-[90%] top-[90%] z-50 hidden w-[17rem] rounded-md border border-black bg-white px-2 py-1 text-sm text-gray-700 shadow-sm group-hover:block">
                            The status of a card holder lapses if the pet has not attended a pet clinic for 3 months in a row. A lapsed card holder can become
                            active again upon having attended at least 3 out of any 6 pet clinics following the lapse.
                          </span>
                        </div>
                        {/* )} */}
                      </div>

                      <div className="flex items-start">
                        <div className="mr-3 flex items-center pt-5">
                          <div className=" flex">Card Status: </div>
                        </div>
                        <div className="flex flex-col">
                          <button
                            ref={btnCardStatusRef}
                            className="my-3 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300 "
                            type="button"
                            onClick={handleToggleCardStatus}
                          >
                            {cardStatusOption + " "}
                            <svg className="ms-3 h-2.5 w-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                            </svg>
                          </button>
                          {cardStatus && (
                            <div ref={cardStatusRef} className="z-10 w-44 divide-y divide-gray-100 rounded-lg bg-white shadow ">
                              <ul className="py-2 text-sm text-gray-700 " aria-labelledby="dropdownHoverButton">
                                {cardStatusOptions.map((option) => (
                                  <li key={option} onClick={() => handleCardStatusOption(option)}>
                                    <button className="block px-4 py-2 hover:bg-gray-100 ">{option}</button>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  <div className="flex items-start">
                    <div className="mr-3 flex items-center py-3">
                      <div className=" flex">
                        Veterinary Fees Covered?:{" "}
                        {VetFees() === "No" ? <span className="pl-3 text-red-600">{VetFees()}</span> : <span className="pl-3 text-black">{VetFees()}</span>}
                        {
                          <div className="group relative mx-[5px] flex items-center justify-center rounded-lg hover:bg-orange-200">
                            <Info size={24} className="block" />
                            <span className="absolute left-[90%] top-[90%] hidden w-[17rem] rounded-md border border-black bg-white px-2 py-1 text-sm text-gray-700 shadow-sm group-hover:block">
                              Veterinary fees are covered for active card holders only.
                            </span>
                          </div>
                        }
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="mr-3 flex items-center pt-5">
                      <div className=" flex">Kennel(s) Received: </div>
                    </div>

                    {/* <div className="flex flex-col items-center">
                      <button
                        onClick={handleShowKennelsReceived}
                        className="mb-2 mr-3 mt-3 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                      >
                        Show years of kennel receipt
                      </button>
                      {showKennelsReceived && (
                        <ul className="mr-3 w-full rounded-lg bg-white px-5 py-2 text-sm text-gray-700 dark:text-gray-200">
                          {kennelList.map((kennel) => (
                            <li key={kennel} className=" py-2">
                              {kennel}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div> */}

                    <div className="flex flex-col">
                      <button
                        ref={btnKennelsReceivedRef}
                        className="my-3 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300 "
                        type="button"
                        onClick={handleToggleKennelsReceived}
                      >
                        {kennelsReceivedOption + " "}
                        <svg className="ms-3 h-2.5 w-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                        </svg>
                      </button>
                      {kennelsReceived && (
                        <div ref={kennelsReceivedRef} className="z-10 w-52 divide-y divide-gray-100 rounded-lg bg-white shadow">
                          {/* <ul className="py-2 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdownHoverButton">
                            {kennelsReceivedOptions.map((option) => (
                              <li key={option} onClick={() => handleKennelsReceivedOption(option)}>
                                <button className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">{option}</button>
                              </li>
                            ))}
                          </ul> */}
                          <ul className="py-2 text-sm text-gray-700" aria-labelledby="dropdownHoverButton">
                            <li key={1}>
                              <div className="flex items-center px-4">
                                <input
                                  id="1"
                                  type="checkbox"
                                  checked={kennelSelection?.allSelected}
                                  onChange={(e) => handleKennel("", e.target.checked, "allSelected")}
                                  className="h-4 w-4 rounded bg-gray-100 text-main-orange accent-main-orange focus:ring-2"
                                />
                                <label htmlFor="1" className="ms-2 text-sm font-bold text-gray-900">
                                  Select All
                                </label>
                              </div>
                            </li>
                            <li key={2}>
                              <div className="flex items-center px-4">
                                <input
                                  id="2"
                                  type="checkbox"
                                  checked={kennelSelection?.clear}
                                  onChange={(e) => handleKennel("", e.target.checked, "clear")}
                                  className="h-4 w-4 rounded bg-gray-100 text-main-orange accent-main-orange focus:ring-2"
                                />
                                <label htmlFor="2" className="ms-2 text-sm font-bold text-gray-900">
                                  Clear All
                                </label>
                              </div>
                            </li>
                            {kennelListOptions?.map((option) => (
                              <li key={option.year}>
                                <div className="flex items-center px-4">
                                  <input
                                    id={String(option.year)}
                                    type="checkbox"
                                    checked={option.state}
                                    onChange={(e) => handleKennel(option.year, e.target.checked, "normal")}
                                    className="h-4 w-4 rounded bg-gray-100 text-main-orange accent-main-orange focus:ring-2"
                                  />
                                  <label htmlFor={String(option.year)} className="ms-2 text-sm font-medium text-gray-900">
                                    {option.year}
                                  </label>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* <div className="pl-2 pt-5 text-base text-red-600">{kennelMessage(kennelList)}</div> */}
                  </div>

                  <div className="flex items-start">
                    <div className="mr-3 flex items-center py-3">
                      <div className=" flex">
                        Qualifies For Kennel?:{" "}
                        {qualifiesForKennel() === "No" ? (
                          <span className="pl-3 text-red-600">{qualifiesForKennel()}</span>
                        ) : (
                          <span className="pl-3 text-black">{qualifiesForKennel()}</span>
                        )}
                        {
                          <div className="group relative mx-[5px] flex items-center justify-center rounded-lg hover:bg-orange-200">
                            <Info size={24} className="block" />
                            <span className="absolute left-[90%] top-[90%] hidden w-[17rem] rounded-md border border-black bg-white px-2 py-1 text-sm text-gray-700 shadow-sm group-hover:block">
                              A kennel is earned if an active card holder has attended at least 9 out of any 12 consecutive pet clinics, and has not received a
                              kennel during the last 3 years.
                            </span>
                          </div>
                        }
                      </div>
                    </div>
                  </div>

                  {/*DATEPICKER*/}
                  {/* <div className="flex items-center">
                    <div className=" flex">
                      16. Starting Date<div className="text-lg text-main-orange">*</div>:{" "}
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
                            </div>*/}

                  <div className="flex items-start">
                    <div className="w-36 pt-3">Comments: </div>
                    <textarea
                      className="m-2 h-24 w-full rounded-lg border-2 border-slate-300 px-2 focus:border-black"
                      placeholder="Type here: e.g. Notes on pet condition, pet behaviour, etc."
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
            {!petName ? (
              <div className=" sticky left-[28rem] top-96 z-30">
                <div className="flex items-center justify-center pt-10">
                  <div
                    className="mx-2 inline-block h-24 w-24 animate-spin rounded-full border-8 border-solid border-current border-main-orange border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
                    role="status"
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="sticky z-50 flex justify-center md:top-[8.9%] xl:top-[11%] 3xl:top-[8.5%]">
                  <div className="relative mb-4 flex grow flex-col items-center rounded-lg bg-slate-300 px-5 py-6">
                    <div className=" text-2xl">Pet Profile</div>
                    <div className="flex justify-center">
                      <button className="absolute right-0 top-0 m-3 rounded-lg bg-main-orange p-3 text-white hover:bg-orange-500" onClick={handleBackButton}>
                        Back To Pet Table
                      </button>
                    </div>
                  </div>
                </div>
                <div ref={printComponentRef} className="flex grow flex-col items-center">
                  <div className="print-div mt-6 flex w-[40%] min-w-[38rem] max-w-xl flex-col items-start">
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
                      <div className="absolute right-4 top-20">
                        {user?.image ? (
                          <Image src={user?.image} alt="Afripaw profile pic" className="ml-auto aspect-auto max-h-52 max-w-[9rem]" width={150} height={200} />
                        ) : (
                          <UserCircle size={140} className="ml-auto aspect-auto" />
                        )}
                      </div>
                      <b className="mb-14 text-center text-xl">Pet Identification Data</b>
                      <div className="mb-2 flex items-center">
                        <b className="mr-3">Pet ID:</b> P{id}
                      </div>

                      <div className="mb-2 flex items-center">
                        <b className="mr-3">Pet name:</b> {petName}
                      </div>

                      <div className="mb-2 flex items-center">
                        <b className="mr-3">Species:</b> {speciesOption === "Select one" ? user?.species : speciesOption}
                      </div>

                      <div className="mb-2 flex items-center">
                        <b className="mr-3">Sex:</b> {sexOption === "Select one" ? user?.sex : sexOption}
                      </div>

                      <div className="mb-2 flex items-center">
                        <b className="mr-3">Age:</b> {ageOption === "Select one" ? user?.age : ageOption}
                      </div>

                      {/* <div className="mb-2 flex items-center">
                        <b className="mr-3">Breed:</b> {breedOption === "Select one" ? user?.breed : breedOption}
                      </div> */}
                      <div className="mb-2 flex items-center">
                        <b className="mr-3">Breed(s):</b>{" "}
                        {breedList
                          // .slice(1, breedList.length)
                          .map((breed) => breed)
                          .join(", ")}
                      </div>

                      <div className="mb-2 flex items-center">
                        <b className="mr-3">Colour(s):</b>{" "}
                        {colourList
                          // .slice(1, colourList.length)
                          .map((colour) => colour)
                          .join(", ")}
                      </div>

                      {speciesOption === "Dog" && (
                        <div className="mb-2 flex items-center">
                          <b className="mr-3">Size:</b> {sizeOption}
                        </div>
                      )}

                      <div className="mb-2 flex items-center">
                        <b className="mr-3">Markings:</b> {markings}
                      </div>

                      <div className="mb-2 flex items-center">
                        <b className="mr-3">Owner:</b>{" "}
                        <button className="underline hover:text-blue-400" onClick={() => handleGoToOwnerProfile(ownerID)}>
                          {firstName} {surname} (N{ownerID})
                        </button>
                      </div>
                    </div>

                    <div className="my-2 flex w-full flex-col rounded-lg border-2 bg-slate-200 p-4">
                      <b className="mb-3 text-center text-xl">Pet Health Data</b>

                      <div className="mb-2 flex items-center">
                        <b className="mr-3">Pet Status:</b> {statusOption === "Select one" ? user?.status : statusOption}
                      </div>

                      <div className="mb-2 flex items-center">
                        <b className="mr-3">Sterilised?:</b>{" "}
                        {sterilisationStatusOption === "Yes" ? (
                          <>
                            {"Yes, " + sterilisationStatusDate.getDate().toString()}/{((sterilisationStatusDate.getMonth() ?? 0) + 1).toString()}/
                            {sterilisationStatusDate.getFullYear().toString()}
                          </>
                        ) : (
                          sterilisationStatusOption
                        )}
                      </div>

                      {sterilisationStatusOption === "No" ? (
                        <>
                          <div className="mb-2 flex items-center">
                            <b className="mr-3">Sterilisation Requested:</b>{" "}
                            {sterilisationRequestedOption === "Yes" ? (
                              <>
                                {sterilisationRequestedDate.getDate().toString()}/{((sterilisationRequestedDate.getMonth() ?? 0) + 1).toString()}/
                                {sterilisationRequestedDate.getFullYear().toString()}
                              </>
                            ) : (
                              "Not Applicable"
                            )}
                          </div>
                        </>
                      ) : (
                        <></>
                      )}

                      {/* sterilisationRequestedOption */}
                      {sterilisationStatusOption === "No" ? (
                        <div className="mb-2 flex items-center">
                          <b className="mr-3">Sterilisation Request Signed At:</b>{" "}
                          {sterilisationStatusOption === "No" ? (
                            <>{sterilisationRequestSignedOption === "Select one" ? user?.sterilisedRequestSigned : sterilisationRequestSignedOption}</>
                          ) : (
                            "Not Applicable"
                          )}
                        </div>
                      ) : (
                        <></>
                      )}

                      {sterilisationStatusOption === "No" ? (
                        <div className="mb-2 flex items-center">
                          <b className="mr-3">Sterilisation Outcome:</b>{" "}
                          {sterilisationStatusOption === "No"
                            ? sterilisationOutcomeOption === "Actioned" || sterilisationOutcomeOption === "No show" || sterilisationOutcomeOption === "No Show"
                              ? `${sterilisationOutcomeOption}, ${sterilisationOutcomeDate.getDate().toString()}/${(
                                  (sterilisationOutcomeDate.getMonth() ?? 0) + 1
                                ).toString()}/${sterilisationOutcomeDate.getFullYear().toString()}`
                              : "Not Applicable"
                            : "Not Applicable"}
                        </div>
                      ) : (
                        <></>
                      )}

                      <div className="mb-2 flex items-center">
                        <b className="mr-3">Vaccination Shot 1:</b>
                        {vaccinationShot1Option === "Yes" ? (
                          <div className="ml-3">
                            {vaccinationShot1Date.getDate() + "/" + (vaccinationShot1Date.getMonth() + 1) + "/" + vaccinationShot1Date.getFullYear()}
                          </div>
                        ) : (
                          <div className="ml-3">{vaccinationShot1Option}</div>
                        )}
                      </div>

                      <div className="mb-2 flex items-center">
                        <b className="mr-3">Vaccination Shot 2:</b>
                        {vaccinationShot2Option === "Yes" && vaccinationShot1Option === "Yes" ? (
                          <div className="ml-3">
                            {vaccinationShot2Date.getDate() + "/" + (vaccinationShot2Date.getMonth() + 1) + "/" + vaccinationShot2Date.getFullYear()}
                          </div>
                        ) : (
                          <div className="ml-3">Not yet</div>
                        )}
                      </div>

                      <div className="mb-2 flex items-center">
                        <b className="mr-3">Vaccination Shot 3:</b>
                        {vaccinationShot3Option === "Yes" && vaccinationShot1Option === "Yes" && vaccinationShot2Option === "Yes" ? (
                          <div className="ml-3">
                            {vaccinationShot3Date.getDate() + "/" + (vaccinationShot3Date.getMonth() + 1) + "/" + vaccinationShot3Date.getFullYear()}
                          </div>
                        ) : (
                          <div className="ml-3">Not yet</div>
                        )}
                      </div>

                      {/* <div className="mb-2 flex items-center">
                        <b className="mr-3">Treatments:</b> {treatmentList.map((treatment) => treatment.type + " (" + treatment.category + ")").join("; ")}
                      </div> */}
                      {ownUser?.role != "General Data Capturer" && (
                        <div className="mb-2 flex items-start">
                          <b className="mr-3">Treatment(s):</b>{" "}
                          <div className="flex flex-col items-start">
                            {treatmentList.map((treatment) => (
                              <button
                                key={treatment?.treatmentID}
                                className="underline hover:text-blue-400"
                                onClick={() => handleGoToTreatmentProfile(treatment?.treatmentID)}
                              >
                                {treatment?.type[0] != undefined
                                  ? treatment?.date.toString() + " " + treatment?.type.join(", ") + " " + "(" + (treatment?.category ?? "") + ")"
                                  : treatment?.date.toString() + " (" + (treatment?.category ?? "") + ")"}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="my-2 flex w-full flex-col rounded-lg border-2 bg-slate-200 p-4">
                      <b className="mb-3 text-center text-xl">AfriPaw Association Data</b>

                      {/* <div className="mb-2 flex items-start gap-1">
                   
                    <b className="mr-1">Clinics Attended:</b> {clinicList.length} in Total 
                    {clinicList.length > 0 && (
                      <div className={""}>
                        ({clinicList.map((clinic) => clinic.date + " " + clinic.area).join("; ")})
                        {showClinicMessage && <div className=" text-red-600">(Veterinary fees covered)</div>}
                      </div>
                    )}
                  </div> */}
                      {/* <div className="mb-2 flex items-start gap-2">
                        <b className="mr-1">Clinics Attended:</b> <div className="min-w-[4rem]">{clinicList.length} in Total</div>
                        {clinicList.length > 0 && (
                          <div className={""}>
                            {"("}
                            {clinicList.map((clinic, index) => {
                              const isLast = index === clinicList.length - 1;
                              return (
                                <React.Fragment key={index}>
                                  {!isLast ? (
                                    <React.Fragment>
                                      {clinic.date} {clinic.area};{" "}
                                    </React.Fragment>
                                  ) : (
                                    <React.Fragment>
                                      {clinic.date} {clinic.area})
                                    </React.Fragment>
                                  )}
                                  {showClinicMessage && isLast && (
                                    <React.Fragment>
                                      <span className="ml-2 text-gray-200">(Veterinary fees covered)</span>
                                    </React.Fragment>
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </div>
                        )}
                      </div> */}
                      <div className="mb-2 flex items-start gap-2">
                        <b className="mr-1">Clinic(s) Attended:</b> <div className="min-w-[4rem]">{clinicList.length} in Total</div>
                        {clinicList.length > 0 && (
                          <div className="flex flex-col">
                            {clinicList
                              .sort((a, b) => {
                                const dateA = new Date(a.date.split("/").reverse().join("-"));
                                const dateB = new Date(b.date.split("/").reverse().join("-"));
                                return dateB.getTime() - dateA.getTime();
                              })
                              .map((clinic, index) => (
                                <div key={index}>{clinic.date + " (" + clinic.area + ")"}</div>
                              ))}
                          </div>
                        )}
                      </div>

                      <div className="mb-2 flex items-center">
                        <b className="mr-3">Last Deworming:</b>{" "}
                        {lastDeworming?.getDate() + "/" + (lastDeworming.getMonth() + 1) + "/" + lastDeworming.getFullYear()}
                        {lastDeworming && isMoreThanSixMonthsAgo(lastDeworming) && <div className="ml-3 text-red-600">(Due for deworming)</div>}
                        {lastDeworming && isMoreThanSixMonthsAgo(lastDeworming) && (
                          <div className="group relative mx-[5px] flex items-center justify-center rounded-lg hover:bg-orange-200">
                            <Info size={24} className="block" />
                            <span className="absolute left-[90%] top-[90%] z-20 hidden w-[14rem] rounded-md border border-black bg-white px-2 py-1 text-sm text-gray-700 shadow-sm group-hover:block">
                              A dog is due for deworming if its last deworming was more than 6 months ago. A cat is due for deworming if its last deworming was
                              more than 3 months ago.
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="mb-2 flex items-center">
                        <b className="mr-3">Membership Type:</b>{" "}
                        {membershipTypeOption === "Standard card holder" ||
                        membershipTypeOption === "Gold card holder" ||
                        membershipTypeOption === "Standard Card Holder" ||
                        membershipTypeOption === "Gold Card Holder"
                          ? `${membershipTypeOption}, ${membershipDate.getDate().toString()}/${(
                              (membershipDate.getMonth() ?? 0) + 1
                            ).toString()}/${membershipDate.getFullYear().toString()}`
                          : membershipTypeOption}
                        {/* {membershipTypeOption && membershipMessage(membershipTypeOption) && (
                          <div className="ml-3 text-red-600">({membershipMessage(membershipTypeOption)})</div>
                        )} */}
                        {/* {membershipTypeOption !== "Non-card holder" &&
                          (membershipStatus() === "(Lapsed)" ? (
                            <div className="ml-3 text-red-600">{membershipStatus()}</div>
                          ) : (
                            <div className="ml-3 text-black">{membershipStatus()}</div>
                          ))}
                        {membershipTypeOption !== "Non-card holder" && membershipStatus() !== "" && (
                          <div className="group relative mx-[5px] flex items-center justify-center rounded-lg hover:bg-orange-200">
                            <Info size={24} className="block" />
                            <span className="absolute left-[90%] top-[90%] hidden w-[14rem] rounded-md border border-black bg-white px-2 py-1 text-sm text-gray-700 shadow-sm group-hover:block">
                              The status of a card holder lapses if the pet has not attended a pet clinic for 3 months in a row. A lapsed card holder can become
                              active again upon having attended at least 3 out of any 6 pet clinics following the lapse.
                            </span>
                          </div>
                        )} */}
                      </div>

                      {membershipTypeOption !== "Non-card holder" && membershipTypeOption !== "Non-card Holder" && (
                        <>
                          <div className="mb-2 flex items-center">
                            <b className="mr-3">Membership Status:</b> {membershipStatus().slice(1, membershipStatus().length - 1)}
                            <div className="group relative mx-[5px] flex items-center justify-center rounded-lg hover:bg-orange-200">
                              <Info size={24} className="block" />
                              <span className="absolute left-[90%] top-[90%] z-20 hidden w-[14rem] rounded-md border border-black bg-white px-2 py-1 text-sm text-gray-700 shadow-sm group-hover:block">
                                The status of a card holder lapses if the pet has not attended a pet clinic for 3 months in a row. A lapsed card holder can
                                become active again upon having attended at least 3 out of any 6 pet clinics following the lapse.
                              </span>
                            </div>
                          </div>

                          <div className="mb-2 flex items-center">
                            <b className="mr-3">Card Status:</b> {cardStatusOption === "Select one" ? user?.cardStatus : cardStatusOption}
                          </div>
                        </>
                      )}

                      <div className="mb-2 flex items-center">
                        <b className="mr-3">Veterinary Fees Covered?:</b>{" "}
                        {VetFees() === "No" ? <span className=" text-red-600">{VetFees()}</span> : <span className=" text-black">{VetFees()}</span>}
                        {
                          <div className="group relative mx-[5px] flex items-center justify-center rounded-lg hover:bg-orange-200">
                            <Info size={24} className="block" />
                            <span className="absolute left-[90%] top-[90%] hidden w-[17rem] rounded-md border border-black bg-white px-2 py-1 text-sm text-gray-700 shadow-sm group-hover:block">
                              Veterinary fees are covered for active card holders only.
                            </span>
                          </div>
                        }
                      </div>

                      <div className="mb-2 flex items-start">
                        <b className="mr-3">Kennels Received:</b> {kennelList.length} in Total{" "}
                        {kennelList.length > 0 && (
                          <div className="flex flex-col px-4">
                            {kennelList
                              .sort((a, b) => Number(a.slice(19, 23)) - Number(b.slice(19, 23)))
                              .map((kennel, index) => (
                                <div key={index}>{kennel}</div>
                              ))}
                          </div>
                        )}
                        {/* {kennelList.length > 0 && <>({kennelList.map((kennel, index) => (kennelList.length - 1 === index ? kennel : kennel + "; "))})</>} */}
                        {/* <div className="pl-3 text-base text-red-600">{kennelMessage(kennelList)}</div> */}
                      </div>

                      <div className="mb-2 flex items-center">
                        <b className="mr-3">Qualifies For Kennel?:</b>{" "}
                        {VetFees() === "No" ? <span className=" text-red-600">{VetFees()}</span> : <span className=" text-black">{VetFees()}</span>}
                        {
                          <div className="group relative mx-[5px] flex items-center justify-center rounded-lg hover:bg-orange-200">
                            <Info size={24} className="block" />
                            <span className="absolute left-[90%] top-[50%] hidden w-[22rem] rounded-md border border-black bg-white px-2 py-1 text-sm text-gray-700 shadow-sm group-hover:block">
                              A kennel is earned if an active card holder has attended at least 9 out of any 12 consecutive pet clinics, and has not received a
                              kennel during the last 3 years.
                            </span>
                          </div>
                        }
                      </div>

                      <div className="mb-2 flex items-start">
                        <b className="mr-3">Comments:</b>
                        {comments}
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
          </>
        )}
      </main>
    </>
  );
};

export default Pet;
