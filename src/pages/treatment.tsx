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
import TreatmentModal from "~/components/treatmentModal";
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

const Treatment: NextPage = () => {
  useSession({ required: true });

  //TYPES
  type previousTreatment = {
    treatmentID: number;
    type: string[];
    category: string;
    date: string;
    comments: string;
  };

  type TypeOptions = {
    type: string;
    state: boolean;
  };

  type TypeSelect = {
    allSelected: boolean;
    clear: boolean;
  };

  const newTreatment = api.petTreatment.create.useMutation();
  const updateTreatment = api.petTreatment.update.useMutation();
  const [isUpdate, setIsUpdate] = useState(false);
  const [isCreate, setIsCreate] = useState(false);
  //Update the table when user is deleted
  const [isDeleted, setIsDeleted] = useState(false);

  //For moving between different pages
  const router = useRouter();

  //-------------------------------LOADING ANIMATIONS-----------------------------------------
  const [isLoading, setIsLoading] = useState(false);

  //-------------------------------UPDATE IDENTIFICATION-----------------------------------------
  const updateIdentification = api.petTreatment.updateIdentification.useMutation();

  //get latest treatmentID
  const latestTreatmentID = api.petTreatment.getLatestTreatmentID.useQuery();

  //Excel upload
  const insertExcelData = api.petTreatment.insertExcelData.useMutation();

  //---------------------------------BULK UPLOAD----------------------------------

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const bstr = event.target?.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0]; // Assuming you're interested in the third sheet   [4]
      console.log("Sheet name: ", wsname);
      const ws: XLSX.WorkSheet | undefined = wb.Sheets[wsname as keyof typeof wb.Sheets];
      const data = ws ? XLSX.utils.sheet_to_json(ws) : [];
      console.log("Data: ", data);

      //This is the format that the insertExcelData mutation expects

      type petTreatmentData = {
        petID: number;
        category: string;
        date: Date; // Or string if you are handling date as a string before conversion.
        type: string[];
        comments: string;
      };

      //change the data so that it gives me the correct format for each column as in the petOwnerData type
      for (const obj of data as petTreatmentData[]) {
        console.log("Object: ", obj);
        //Object.keys(obj).forEach((key) => {
        //  console.log("Key: ", key);
        //}
        //take the first character away from the ownerID
        // obj.petID = Number(obj.petID.toString().slice(1));

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

        obj.type = [String(obj.type)];

        //comments
        obj.comments = "";
      }

      //Turn the data into this type of object: {firstName: "John", surname: "Doe", email: "xxxxxxx@xxxxx", mobile: "0712345678", address: "1 Main Road, Observatory, Cape Town, 7925", comments: "None"}

      insertExcelData.mutate(data as petTreatmentData[], {
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
      // void convert_to_json(data as Record<string, unknown>[]);
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

  //-------------------------------ID-----------------------------------------
  const [id, setID] = useState(0);

  //-------------------------------ORDER-----------------------------------------
  //Order fields
  //sorts the table according to specific fields
  const [order, setOrder] = useState("date");

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

  //------------------------------NEW CODE-----------------------------------------

  //Flattens the pages array into one array
  const owners_pets_treatments = queryData?.pages.flatMap((page) => page.treatment_data);

  //----------------------------------------FIRST ATTEMPT-----------------------------------------

  // //create a new data object that contains the owner, pet and treatment data. Data can be repeated.
  // const treatments = owners_pets_treatments?.map((owner) => {
  //   return owner.pets.map((pet) => {
  //     return pet.petTreatments.map((treatment) => {
  //       return {
  //         ownerID: owner.ownerID,
  //         surname: owner.surname,
  //         firstName: owner.firstName,
  //         area: owner.addressArea,
  //         greaterArea: owner.addressGreaterArea,
  //         petName: pet.petName,
  //         petID: pet.petID,
  //         species: pet.species,
  //         breed: pet.breed,
  //         treatmentID: treatment.treatmentID,
  //         date: treatment.date,
  //         category: treatment.category,
  //         type: treatment.type,
  //         comments: treatment.comments,
  //         updatedAt: treatment.updatedAt,
  //       };
  //     });
  //   });
  // });

  // const pet_treatment_data = treatments?.flat(2);

  // const treatment = pet_treatment_data?.find((treatment) => treatment.treatmentID === id);

  //----------------------------------------SECOND ATTEMPT-----------------------------------------
  //create a new data object that will write all the data into one object
  const pet_treatment_data = owners_pets_treatments?.map((treatment) => {
    return {
      ownerID: treatment?.pet?.ownerID ?? 0,
      surname: treatment?.pet?.owner?.surname ?? "",
      firstName: treatment?.pet?.owner?.firstName ?? "",
      area: treatment?.pet?.owner?.addressArea?.area ?? "",
      greaterArea: treatment?.pet?.owner?.addressGreaterArea.greaterArea ?? "",
      petName: treatment?.pet?.petName ?? "",
      petID: treatment?.pet?.petID ?? 0,
      species: treatment?.pet?.species ?? "",
      breed: treatment?.pet?.breed ?? "",
      treatmentID: treatment?.treatmentID,
      date: treatment?.date,
      category: treatment?.category,
      type: treatment?.type,
      comments: treatment?.comments,
      updatedAt: treatment?.updatedAt,
    };
  });

  const treatment = pet_treatment_data?.find((treatment) => treatment.treatmentID === id);

  //------------------------------------NEW CODE-----------------------------------------

  //-------------------------------ORIGINAL CODE-----------------------------------------
  // //Flattens the pages array into one array
  // const user_data = queryData?.pages.flatMap((page) => page.user_data);
  // const pet_data = queryData?.pages.flatMap((page) => page.pet_data);
  // const owner_data = queryData?.pages.flatMap((page) => page.owner_data);

  // const treatment_pet_data = user_data?.map((treatment) => {
  //   // Find the owner that matches the user's ownerId
  //   const pet = pet_data?.find((p) => (p.petID ?? 0) === treatment.petID);
  //   // Combine the user data with the found owner data
  //   return { ...treatment, ...pet };
  // });

  // const pet_treatment_data = treatment_pet_data?.map((pet) => {
  //   // Find the owner that matches the user's ownerId
  //   const owner = owner_data?.find((o) => (o.ownerID ?? 0) === pet.ownerID);
  //   // Combine the user data with the found owner data
  //   return { ...pet, ...owner };
  // });

  // const treatment = pet_treatment_data?.find((treatment) => treatment.treatmentID === id);
  //-------------------------------ORIGINAL CODE-----------------------------------------

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

  //-------------------------------DELETE ALL USERS-----------------------------------------
  //Delete all users
  const deleteAllUsers = api.petTreatment.deleteAllTreatments.useMutation();
  const handleDeleteAllUsers = async () => {
    await deleteAllUsers.mutateAsync();
    isDeleted ? setIsDeleted(false) : setIsDeleted(true);
  };

  //---------------------------------PRINTING----------------------------------
  const printComponentRef = useRef(null);

  //---------------------------------EDIT BOXES----------------------------------
  const [comments, setComments] = useState("");
  const [startingDate, setStartingDate] = useState(new Date());
  const [petID, setPetID] = useState(0);
  const [petName, setPetName] = useState("");
  const [ownerID, setOwnerID] = useState(0);
  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [area, setArea] = useState("");
  const [greaterArea, setGreaterArea] = useState("");

  //const [image, setImage] = useState("");

  //userID
  //const [userID, setUserID] = useState("");
  // const [id, setID] = useState(0);

  //-------------------------------PREVIOUS TREATMENTS-----------------------------------------
  const [previousTreatments, setPreviousTreatments] = useState<previousTreatment[]>([]);
  const prevTreatments = api.petTreatment.getAllTreatmentsForPet.useQuery({ petID: petID });

  //---------------------------------NAVIGATION OF PET TO TREATMENT----------------------------------
  useEffect(() => {
    if (router.asPath.includes("petID")) {
      // setPetID(Number(router.asPath.split("=")[1]));

      const query = router.asPath.split("?")[1] ?? "";

      // console.log("Owner ID: ", query?.split("&")[0]?.split("=")[1] ?? "");
      // console.log("Owner first name: ", query?.split("&")[1]?.split("=")[1] ?? "");
      // console.log("Owner surname: ", query?.split("&")[2]?.split("=")[1] ?? "");
      // console.log("Owner street number: ", query?.split("&")[3]?.split("=")[1] ?? "");
      // console.log("Owner street: ", query?.split("&")[4]?.split("=")[1] ?? "");
      // console.log("Owner area: ", query?.split("&")[5]?.split("=")[1] ?? "");
      // console.log("Owner greater area: ", query?.split("&")[6]?.split("=")[1] ?? "");

      //Check for any plus signs in the query and replace them with spaces

      setPetID(Number(query?.split("&")[0]?.split("=")[1]));
      console.log("Pet ID: ", Number(query?.split("&")[0]?.split("=")[1]));
      console.log("Pet ID: ", petID);
      setPetName(String(query?.split("&")[1]?.split("=")[1]?.replaceAll("+", " ")));
      console.log("Pet name: ", String(query?.split("&")[1]?.split("=")[1]?.replaceAll("+", " ")));
      console.log("Pet name: ", petName);
      setOwnerID(Number(query?.split("&")[2]?.split("=")[1]));
      setFirstName(String(query?.split("&")[3]?.split("=")[1]?.replaceAll("+", " ")));
      setSurname(String(query?.split("&")[4]?.split("=")[1]?.replaceAll("+", " ")));
      setArea(String(query?.split("&")[6]?.split("=")[1]?.replaceAll("+", " ")));
      setGreaterArea(String(query?.split("&")[5]?.split("=")[1]?.replaceAll("+", " ")));

      setPreviousTreatments(
        prevTreatments.data?.map((treatment) => ({
          treatmentID: treatment.treatmentID ?? 0,
          type: treatment.type ?? "",
          category: treatment.category ?? "",
          date:
            treatment.date.getDate().toString() ?? "" + "/" + (treatment.date.getMonth() + 1).toString() + "/" + treatment.date.getFullYear().toString() ?? "",
          comments: treatment.comments ?? "",
        })) ?? [],
      );

      console.log("Previous treatments: ", prevTreatments.data);
      //console.log("Query: ", router.query);
      //console.log("Route: ", router.route);
      //console.log("as path: ", router.asPath);
      //console.log("base path: ", router.basePath);
      // console.log("Owner ID: ", ownerID);
      setIsCreate(true);
    }

    if (router.asPath.includes("treatmentID")) {
      setID(Number(router.asPath.split("=")[1]));

      // setIsViewProfilePage(true);
      void handleViewProfilePage(Number(router.asPath.split("=")[1]));
    }
  }, [router.asPath]);

  //get treatment by id. Specifically for the view profile page
  const treatmentByID = router.asPath.includes("treatmentID")
    ? api.petTreatment.getTreatmentByID.useQuery({ treatmentID: Number(router.asPath.split("=")[1]) })
    : api.petTreatment.getTreatmentByID.useQuery({ treatmentID: 1000001 });

  //fetch previous treatments
  useEffect(() => {
    void prevTreatments.refetch();
    console.log(
      "Treatment Dates!!!: ",
      prevTreatments?.data?.map(
        (treatment) => treatment.date.getDate.toString() + "/" + (treatment.date.getMonth() + 1).toString() + "/" + treatment.date.getFullYear.toString(),
      ),
    );
    setPreviousTreatments(
      prevTreatments.data?.map((treatment) => ({
        treatmentID: treatment.treatmentID ?? 0,
        type: treatment.type ?? "",
        category: treatment.category ?? "",
        date: treatment.date.getDate().toString() + "/" + (treatment.date.getMonth() + 1).toString() + "/" + treatment.date.getFullYear().toString(),
        comments: treatment.comments ?? "",
      })) ?? [],
    );
  }, [petID, router.asPath, isCreate]);

  //-------------------------------NAVIGATING BY CLICKING ON THE TAB---------------------
  useEffect(() => {
    if (!isCreate && !router.asPath.includes("petID")) {
      setPetID(Number(treatment?.petID ?? 0));
    }
  }, [router.asPath]);

  // const pet = api.pet.getPetByID.useQuery({ petID: petID });

  // useEffect(() => {
  //   void pet.refetch();
  // }, []);

  //-------------------------------UPDATE USER-----------------------------------------
  //const treatment = api.petTreatment.getTreatmentByID.useQuery({ treatmentID: id });

  //--------------------------------CREATE NEW USER DROPDOWN BOXES--------------------------------
  //WEBHOOKS FOR DROPDOWN BOXES
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [categoryOption, setCategoryOption] = useState("Select one");
  const categoryRef = useRef<HTMLDivElement>(null);
  const btnCategoryRef = useRef<HTMLButtonElement>(null);

  const [isTypeOpen, setIsTypeOpen] = useState(false);
  const [typeOption, setTypeOption] = useState("Select here");
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

  const categoryOptions = ["Pet clinic, Infield", "Pet clinic, Admission to TEARS", "Reported outside of pet clinic"];

  //TYPE
  const handleToggleType = () => {
    setIsTypeOpen(!isTypeOpen);
  };

  //SetStateAction<string>
  const handleTypeOption = (option: string) => {
    setTypeOption(option);
    setIsTypeOpen(false);
  };

  const [typeListOptions, setTypeListOptions] = useState<TypeOptions[]>([]);
  const [typeSelection, setTypeSelection] = useState<TypeSelect>();
  //to select multiple roles
  const [typeList, setTypeList] = useState<string[]>([]);

  const handleType = (option: SetStateAction<string>, state: boolean, selectionCategory: string) => {
    if (selectionCategory === "allSelected") {
      setTypeOption("Select All");
      setTypeSelection({ allSelected: state, clear: false });

      const types = typeListOptions.map((type) => type.type);
      setTypeList(types);
      //order the roleList in alphabetical order
      // setRoleList(roleList.sort((a, b) => a.localeCompare(b)));
      setTypeListOptions(typeListOptions.map((type) => ({ ...type, state: true })));
    } else if (selectionCategory === "clear") {
      setTypeOption("Clear All");
      setTypeSelection({ allSelected: false, clear: state });

      setTypeList([]);
      setTypeListOptions(typeListOptions.map((type) => ({ ...type, state: false })));
    } else if (selectionCategory === "normal") {
      setTypeOption(option);
      setTypeSelection({ allSelected: false, clear: false });
      if (state) {
        if (!typeList.includes(String(option))) {
          setTypeList([...typeList, String(option)]);
          //order the roleList in alphabetical order
          // setRoleList(roleList.sort((a, b) => a.localeCompare(b)));
        }

        setTypeListOptions(typeListOptions.map((type) => (type.type === option ? { ...type, state: true } : type)));
        // console.log("Greater Area list: ", greaterAreaList);
        // console.log("Greater Area List Options: ", greaterAreaListOptions);
      } else {
        const updatedTypeList = typeList.filter((type) => type !== option);
        setTypeList(updatedTypeList);
        //order the roleList in alphabetical order
        // setRoleList(roleList.sort((a, b) => a.localeCompare(b)));
        setTypeListOptions(typeListOptions.map((type) => (type.type === option ? { ...type, state: false } : type)));
        // console.log("Greater Area list: ", greaterAreaList);
        // console.log("Greater Area List Options: ", greaterAreaListOptions);
      }
    }
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
    "Ear infection",
    "Ehrlichia",
    "Eye infection",
    "Feline AIDS",
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
    "Vaccinations (ad hoc)",
    "Vomiting and diarrhea",
    "Wound shave and clean",
    "Wound stitch-up",
    "Other",
  ];

  //-------------------------------UPDATE USER-----------------------------------------
  //Update the user's details in fields
  const handleUpdateUserProfile = async (id: number) => {
    setID(id);

    const treatment = pet_treatment_data?.find((treatment) => treatment.treatmentID === id);

    if (treatment) {
      // Assuming userQuery.data contains the user object
      const userData = treatment;

      setPetID(userData.petID ?? 0);
      setPetName(userData.petName ?? "");
      setFirstName(userData.firstName ?? "");
      setSurname(userData.surname ?? "");
      setOwnerID(userData.ownerID ?? 0);
      setArea(userData.area ?? "");
      setGreaterArea(userData.greaterArea ?? "");

      setCategoryOption(userData.category ?? "Select one");
      setTypeList(userData.type ?? "Select here");
      //setTypeOption(userData.type ?? "Select one");
      setStartingDate(userData?.date ?? new Date());
      setComments(userData.comments ?? "");

      setTypeListOptions(
        typeOptions.map((type) => ({
          type: type,
          state: userData.type.includes(type),
        })),
      );

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
    const treatment = pet_treatment_data?.find((treatment) => treatment.treatmentID === id);
    if (treatment) {
      // Assuming userQuery.data contains the user object
      const userData = treatment;
      setCategoryOption(userData.category ?? "Select one");
      //setTypeOption(userData.type ?? "");
      setTypeList(userData.type ?? "Select here");
      setStartingDate(userData.date ?? new Date());
      setComments(userData.comments ?? "");

      setTypeListOptions(
        typeOptions.map((type) => ({
          type: type,
          state: userData.type.includes(type),
        })),
      );

      // if (userData.area === "") {
      //   console.log("Area option is select one");
      //   setAreaOption("Select one");
      // }
    }
  }, [isUpdate, isCreate]); // Effect runs when userQuery.data changes

  const handleUpdateUser = async () => {
    setIsLoading(true);
    await updateTreatment.mutateAsync({
      treatmentID: id,
      category: categoryOption === "Select one" ? "" : categoryOption,
      type: typeList,
      date: startingDate,
      comments: comments,
    });
    //After the newUser has been created make sure to set the fields back to empty
    setCategoryOption("Select one");
    setTypeOption("Select here");
    setTypeList([]);
    setTypeListOptions(
      typeOptions.map((type) => ({
        type: type,
        state: false,
      })),
    );
    setComments("");
    setIsUpdate(false);
    setIsCreate(false);

    setIsLoading(false);
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

  //get previous treatments
  // useEffect(() => {
  //   void prevTreatments.refetch();
  //   setPreviousTreatments(
  //     prevTreatments.data?.map((treatment) => ({
  //       id: treatment.treatmentID ?? 0,
  //       type: treatment.type ?? "",
  //       category: treatment.category ?? "",
  //       date: treatment.date.getDate().toString() + "/" + (treatment.date.getMonth() + 1).toString() + "/" + treatment.date.getFullYear().toString(),
  //       comments: treatment.comments ?? "",
  //     })) ?? [],
  //   );
  // }, [petID, router.asPath, isCreate]);

  const [getPreviousTreatments, setGetPreviousTreatments] = useState(false);
  const [numberOfFetches, setNumberOfFetches] = useState(0);
  useEffect(() => {
    if (router.asPath.includes("petID") && (petID === 0 || (previousTreatments.length === 0 && numberOfFetches < 400))) {
      setNumberOfFetches(numberOfFetches + 1);
      void prevTreatments.refetch();
      getPreviousTreatments ? setGetPreviousTreatments(false) : setGetPreviousTreatments(true);
    }

    setPreviousTreatments(
      prevTreatments.data?.map((treatment) => ({
        treatmentID: treatment.treatmentID ?? 0,
        type: treatment.type ?? "",
        category: treatment.category ?? "",
        date: treatment.date.getDate().toString() + "/" + (treatment.date.getMonth() + 1).toString() + "/" + treatment.date.getFullYear().toString(),
        comments: treatment.comments ?? "",
      })) ?? [],
    );

    setTypeListOptions(
      typeOptions.map((type) => ({
        type: type,
        state: false,
      })),
    );
  }, [getPreviousTreatments]);

  //-------------------------------NEW USER-----------------------------------------

  const handleNewUser = async () => {
    setIsLoading(true);
    const query = router.asPath.split("?")[1] ?? "";
    const newUser_ = await newTreatment.mutateAsync({
      petID: petID === 0 ? Number(query?.split("&")[0]?.split("=")[1]) : petID,
      category: categoryOption === "Select one" ? "" : categoryOption,
      type: typeList.sort((a, b) => a.localeCompare(b)),
      date: startingDate,
      comments: comments,
    });

    setIsCreate(false);
    setIsUpdate(false);

    // return newUser_;

    //update identification table
    if (newUser_?.treatmentID) {
      await updateIdentification.mutateAsync({
        treatmentID: newUser_?.treatmentID ?? 0,
      });
    }

    setIsLoading(false);
  };

  //-------------------------------VIEW PROFILE PAGE-----------------------------------------
  const [isViewProfilePage, setIsViewProfilePage] = useState(false);
  const handleViewProfilePage = async (id: number) => {
    setIsViewProfilePage(true);
    setID(id);
    const treatment = pet_treatment_data?.find((treatment) => treatment.treatmentID === id);
    //console.log("View profile page: ", JSON.stringify(clinic.data));
    if (treatment) {
      // Assuming userQuery.data contains the user object
      const userData = treatment;
      setPetID(userData.petID ?? 0);
      setPetName(userData.petName ?? "");
      setFirstName(userData.firstName ?? "");
      setSurname(userData.surname ?? "");
      setOwnerID(userData.ownerID ?? 0);
      setArea(userData.area ?? "");
      setGreaterArea(userData.greaterArea ?? "");
      setCategoryOption(userData.category ?? "");
      setTypeList(userData.type ?? "");
      setStartingDate(userData.date ?? new Date());
      setComments(userData.comments ?? "");

      setTypeListOptions(
        typeOptions.map((type) => ({
          type: type,
          state: userData.type.includes(type),
        })),
      );

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
      //void treatment.refetch();
    }
    if (treatment) {
      const userData = treatment;
      setCategoryOption(userData.category ?? "");
      setTypeList(userData.type ?? "");
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
  }, [isViewProfilePage]); // Effect runs when userQuery.data changes

  const [getTreatment, setGetTreatment] = useState(false);
  useEffect(() => {
    if (router.asPath.includes("treatmentID") && (categoryOption === "" || categoryOption === "Select one" || petID === 0)) {
      void treatmentByID.refetch();
      getTreatment ? setGetTreatment(false) : setGetTreatment(true);
    }
    //void owner?.refetch();

    //const user = user_data?.find((user) => user.ownerID === id);
    const user = treatmentByID?.data;
    console.log("View profile page: ", JSON.stringify(user));
    if (user) {
      // Assuming userQuery.data contains the user object
      const userData = user;
      setPetID(petID === 0 ? userData.petID ?? 0 : petID);
      setPetName(userData.pet.petName ?? "");
      setFirstName(userData.pet.owner.firstName ?? "");
      setSurname(userData.pet.owner.surname ?? "");
      setOwnerID(userData.pet.ownerID ?? 0);
      setArea(userData.pet.owner.addressArea?.area ?? "");
      setGreaterArea(userData.pet.owner.addressGreaterArea.greaterArea ?? "");

      setCategoryOption(userData.category ?? "");
      setTypeList(userData.type ?? "");
      setStartingDate(userData.date ?? new Date());
      setComments(userData.comments ?? "");
    }
  }, [getTreatment]);

  //Go to update page from the view profile page
  const handleUpdateFromViewProfilePage = async () => {
    setIsUpdate(true);
    setIsViewProfilePage(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  //-------------------------------BACK BUTTON-----------------------------------------
  const handleBackButton = async () => {
    if (Number(router.asPath.split("=")[1]) != 0 && !isViewProfilePage && !isUpdate) {
      await router.push(`/pet`);
    }
    //console.log("Back button pressed");

    setQuery("");
    setIsUpdate(false);
    setIsCreate(false);
    setIsViewProfilePage(false);
    setID(0);
    setCategoryOption("Select one");
    setTypeOption("Select here");
    setTypeList([]);
    setTypeListOptions(
      typeOptions.map((type) => ({
        type: type,
        state: false,
      })),
    );
    setTypeSelection({ allSelected: false, clear: false });
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

    if (categoryOption === "Select one") mandatoryFields.push("Category");
    if (startingDate === null) mandatoryFields.push("Date");
    //if (typeOption === "Select one") mandatoryFields.push("Type");
    if (typeList.length === 0) mandatoryFields.push("Type");

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

  //TREATMENT MODAL
  const [isTreatmentModalOpen, setIsTreatmentModalOpen] = useState(false);
  const [treatmentModal, setTreatmentModal] = useState<previousTreatment>();
  const handleTreatmentModal = (id: number, category: string, type: string[], date: string, comments: string) => {
    setTreatmentModal({ treatmentID: id, category: category, type: type, date: date, comments: comments });
    setIsTreatmentModalOpen(true);
  };

  //----------------------------------ORDER FIELDS----------------------------------
  const handleOrderFields = (field: string) => {
    setOrder(field);
  };

  //------------------------------------GO TO PET PROFILE--------------------------------------
  const handleGoToPetProfile = async (petID: number) => {
    await router.push({
      pathname: "/pet",
      query: { petID: petID },
    });
  };

  //------------------------------------GO TO OWNER PROFILE--------------------------------------
  const handleGoToOwnerProfile = async (ownerID: number) => {
    await router.push({
      pathname: "/owner",
      query: { ownerID: ownerID },
    });
  };

  // //-------------------------------INFINITE SCROLLING WITH INTERSECTION OBSERVER-----------------------------------------
  // const observerTarget = useRef<HTMLDivElement | null>(null);

  // const [limit] = useState(12);
  // const {
  //   data: queryData,
  //   fetchNextPage,
  //   hasNextPage,
  //   refetch,
  // } = api.petTreatment.searchTreatmentsInfinite.useInfiniteQuery(
  //   {
  //     treatmentID: id,
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
  // const pet_data = queryData?.pages.flatMap((page) => page.pet_data);
  // const owner_data = queryData?.pages.flatMap((page) => page.owner_data);

  // //combine the following two objects into one object
  // const treatment_data = user_data?.map((user, index) => ({ ...user, ...pet_data?.[index] }));

  // // Assuming each user object contains an ownerId or similar property to relate to the owner
  // const pet_treatment_data = treatment_data?.map((pet) => {
  //   // Find the owner that matches the user's ownerId
  //   const owner = owner_data?.find((o) => (o.ownerID ?? 0) === pet.ownerID);
  //   // Combine the user data with the found owner data
  //   return { ...pet, ...owner };
  // });

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

  //------------------------------------------DOWNLOADING OWNER TABLE TO EXCEL FILE------------------------------------------
  const downloadTreatmentTable = api.petTreatment.download.useQuery({ searchQuery: query });
  const handleDownloadTreatmentTable = async () => {
    setIsLoading(true);
    //take the download user table query data and put it in an excel file
    const data = downloadTreatmentTable.data;
    const fileName = "Treatment Table";
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
        <title>Treatment Profiles</title>
      </Head>
      <main className="flex flex-col text-normal">
        <Navbar />
        {!isCreate && !isUpdate && !isViewProfilePage && (
          <>
            <div className=" flex flex-col text-black">
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
                    onClick={handleDownloadTreatmentTable}
                  >
                    {isLoading ? (
                      <div
                        className="mx-2 inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-current border-white border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
                        role="status"
                      />
                    ) : (
                      <div>Download Pet Treatment Table</div>
                    )}
                  </button>
                  <input
                    className="mt-3 flex w-1/3 rounded-lg border-2 border-zinc-800 px-2"
                    placeholder="Search..."
                    onChange={(e) => setQuery(getQueryFromSearchPhrase(e.target.value))}
                  />
                  {/* <div className="border-2 bg-gray-300 p-3 text-blue-500">
                    Upload
                    <input type="file" onChange={(e) => void handleUpload(e)} accept=".xlsx, .xls" />
                  </div> */}
                  {/* <button className="absolute right-0 top-0 mx-3 mb-3 rounded-lg bg-main-orange p-3 text-white hover:bg-orange-500" onClick={handleCreateNewUser}>
                  Create new Clinic
                </button> */}
                  {/* <button className="absolute left-0 top-0 mx-3 mb-3 rounded-lg bg-main-orange p-3 hover:bg-orange-500" onClick={handleDeleteAllUsers}>
                    Delete all users
                  </button> */}
                </div>
              </div>

              {pet_treatment_data ? (
                <article className="my-6 flex max-h-[60%] w-full items-center justify-center overflow-auto rounded-md shadow-inner">
                  <table className="table-auto">
                    <thead className="">
                      <tr>
                        <th className="px-4 py-2"></th>
                        {/* <th className="px-4 py-2">ID</th> */}
                        <th className="w-[35px] px-4 py-2">
                          <span className="group relative inline-block">
                            <button className={`${order === "date" ? "underline" : ""}`} onClick={() => handleOrderFields("date")}>
                              Treatment Date
                            </button>
                            <span className="absolute right-[-20px] top-full hidden w-[110px] rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 shadow-sm group-hover:block">
                              Sort reverse chronologically
                            </span>
                          </span>
                        </th>
                        {/* <th className="px-4 py-2">Pet ID</th> */}
                        <th className="px-4 py-2">Pet</th>
                        <th className="px-4 py-2">Owner</th>
                        <th className="px-4 py-2">Greater Area</th>
                        <th className="px-4 py-2">Area</th>
                        <th className="px-4 py-2">Category</th>
                        <th className="px-4 py-2">
                          Type
                          {/* <button className={`${order == "condition" ? "underline" : ""}`} onClick={() => handleOrderFields("condition")}>
                          Conditions
                        </button> */}
                        </th>
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
                      {pet_treatment_data?.map((treatment, index) => {
                        return (
                          <tr className="items-center">
                            <td className=" border px-2 py-1">
                              <div className="flex justify-center">{index + 1}</div>
                            </td>
                            {/* <td className="border px-2 py-1">T{treatment.treatmentID}</td> */}
                            <td className="border px-2 py-1">
                              {treatment?.date?.getDate()?.toString() ?? ""}
                              {"/"}
                              {((treatment?.date?.getMonth() ?? 0) + 1)?.toString() ?? ""}
                              {"/"}
                              {treatment?.date?.getFullYear()?.toString() ?? ""}
                            </td>
                            {/* <td className="border px-4 py-2">P{treatment.petID}</td> */}
                            <td className="border px-2 py-1">
                              <button className="underline hover:text-blue-400" onClick={() => handleGoToPetProfile(treatment.petID)}>
                                {treatment.petName} ({treatment.species})
                              </button>
                            </td>
                            <td className="border px-2 py-1">
                              <button className="underline hover:text-blue-400" onClick={() => handleGoToOwnerProfile(treatment.ownerID)}>
                                {treatment.firstName} {treatment.surname}
                              </button>
                            </td>
                            <td className="border px-2 py-1">{treatment.greaterArea}</td>
                            <td className="border px-2 py-1">{treatment.area}</td>
                            <td className="border px-2 py-1">{treatment.category}</td>
                            <td className="border px-2 py-1">{treatment.type.slice(0, 8).join("; ")}</td>
                            <td className=" border px-2 py-1">
                              {treatment?.updatedAt?.getDate()?.toString() ?? ""}
                              {"/"}
                              {((treatment?.updatedAt?.getMonth() ?? 0) + 1)?.toString() ?? ""}
                              {"/"}
                              {treatment?.updatedAt?.getFullYear()?.toString() ?? ""}
                            </td>

                            <div className="flex">
                              <div className="relative flex items-center justify-center">
                                <span className="group relative mx-[5px] my-3 flex items-center justify-center rounded-lg hover:bg-orange-200">
                                  <Trash
                                    size={24}
                                    className="block"
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
                                  <span className="absolute bottom-full hidden rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 shadow-sm group-hover:block">
                                    Delete treatment
                                  </span>
                                </span>
                              </div>

                              <div className="relative flex items-center justify-center">
                                <span className="group relative mx-[5px] my-3 flex items-center justify-center rounded-lg hover:bg-orange-200">
                                  <Pencil size={24} className="block" onClick={() => handleUpdateUserProfile(treatment.treatmentID ?? 0)} />
                                  <span className="absolute bottom-full hidden rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 shadow-sm group-hover:block">
                                    Update treatment
                                  </span>
                                </span>
                              </div>

                              <div className="relative flex items-center justify-center">
                                <span className="group relative mx-[5px] my-3 flex items-center justify-center rounded-lg hover:bg-orange-200">
                                  <AddressBook size={24} className="block" onClick={() => handleViewProfilePage(treatment.treatmentID ?? 0)} />
                                  <span className="absolute bottom-full hidden w-[105px] rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 shadow-sm group-hover:block">
                                    View treatment profile
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
                <b className=" text-2xl">{isUpdate ? "Update Pet Treatment Data" : "Add Pet Treatment"}</b>
                <div className="flex justify-center">
                  <button className="absolute right-0 top-0 m-3 rounded-lg bg-main-orange p-3 text-white hover:bg-orange-500" onClick={handleBackButton}>
                    Back To Treatment Table
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
                {"("}All fields with <span className="px-1 text-lg text-main-orange"> * </span> are compulsary{")"}
              </label>
              <div className="flex w-[46%] flex-col">
                {/*<div className="p-2">User ID: {(lastUserCreated?.data?.userID ?? 1000000) + 1}</div>*/}
                <div className="relative my-2 flex w-full flex-col rounded-lg border-2 bg-slate-200 p-4">
                  <b className="mb-3 text-center text-xl">Pet Treatment Data</b>

                  <div className="flex py-2">
                    Treatment ID: <div className="px-3">T{isCreate ? String((latestTreatmentID?.data?.treatmentID ?? 0) + 1) : id}</div>
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

                  {/*PET ID do not make it editable*/}
                  <div className="py-2">Pet ID: P{petID ? petID : treatment?.petID}</div>
                  <div className="py-2">Pet Name: {petName ? petName : treatment?.petName}</div>
                  <div className="py-2">
                    Owner: {firstName ? firstName : treatment?.firstName} {surname ? surname : treatment?.surname} (N{ownerID ? ownerID : treatment?.ownerID})
                  </div>
                  <div className="py-2">Greater Area: {greaterArea ? greaterArea : treatment?.greaterArea}</div>
                  <div className="py-2">Area: {area ? area : treatment?.area}</div>

                  {isCreate && (
                    <div className="mb-2 flex items-start py-2">
                      <div className="mr-3">Previous Treatments:</div>{" "}
                      <div className="flex flex-col items-start">
                        {previousTreatments.map((treatment) => (
                          <button
                            key={treatment?.treatmentID}
                            className="underline hover:text-blue-400"
                            onClick={() =>
                              handleTreatmentModal(treatment?.treatmentID, treatment?.category, treatment?.type, treatment?.date, treatment?.comments)
                            }
                          >
                            {(treatment?.type[0] ?? "") + " (" + (treatment?.category ?? "") + ")"}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/*Draw a horisontal line */}
                  <hr className="my-3 border-[1px] border-gray-400" />

                  {/*CATEGORY*/}

                  <div className="flex items-start">
                    <div className="mr-3 flex items-center pt-4">
                      <label>
                        Category<span className="text-lg text-main-orange">*</span>:{" "}
                      </label>
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
                        <div ref={categoryRef} className="z-10 w-56 divide-y divide-gray-100 rounded-lg bg-white shadow dark:bg-gray-700">
                          <ul className=" w-56 py-2 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdownHoverButton">
                            {categoryOptions.map((option) => (
                              <li key={option} className={"flex w-56 flex-col items-start"} onClick={() => handleCategoryOption(option)}>
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
                      <div className=" flex">Type(s): </div>
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
                          {/* <ul className="py-2 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdownHoverButton">
                            {typeOptions.map((option) => (
                              <li key={option} onClick={() => handleTypeOption(option)}>
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
                                  checked={typeSelection?.allSelected}
                                  onChange={(e) => handleType("", e.target.checked, "allSelected")}
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
                                  checked={typeSelection?.clear}
                                  onChange={(e) => handleType("", e.target.checked, "clear")}
                                  className="h-4 w-4 rounded bg-gray-100 text-main-orange accent-main-orange focus:ring-2"
                                />
                                <label htmlFor="2" className="ms-2 text-sm font-medium text-gray-900">
                                  Clear All
                                </label>
                              </div>
                            </li>
                            {typeListOptions?.map((option) => (
                              <li key={option.type}>
                                <div className="flex items-center px-4">
                                  <input
                                    id={String(option.type)}
                                    type="checkbox"
                                    checked={option.state}
                                    onChange={(e) => handleType(option.type, e.target.checked, "normal")}
                                    className="h-4 w-4 rounded bg-gray-100 text-main-orange accent-main-orange focus:ring-2"
                                  />
                                  <label htmlFor={String(option.type)} className="ms-2 text-sm font-medium text-gray-900">
                                    {option.type}
                                  </label>
                                </div>
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
                      placeholder="Type here: e.g. Notes on treatment success, problem areas, and follow-up actions"
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
            {categoryOption === "" || categoryOption === "Select one" ? (
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
                <div className="flex justify-center">
                  <div className="relative mb-4 flex grow flex-col items-center rounded-lg bg-slate-200 px-5 py-6">
                    <div className=" text-2xl">Pet Treatment Profile</div>
                    <div className="flex justify-center">
                      <button className="absolute right-0 top-0 m-3 rounded-lg bg-main-orange p-3 text-white hover:bg-orange-500" onClick={handleBackButton}>
                        Back To Treatment Table
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

                      <b className="mb-14 text-center text-xl">Pet Treatment Data</b>
                      <div className="mb-2 flex items-center">
                        <b className="mr-3">Treatment ID:</b> {id}
                      </div>

                      <div className="mb-2 flex items-center">
                        <b className="mr-3">Date:</b>{" "}
                        {startingDate?.getDate() + "/" + ((startingDate?.getMonth() ?? 0) + 1) + "/" + startingDate?.getFullYear() ?? ""}
                      </div>

                      <div className="mb-2 flex items-center">
                        <b className="mr-3">Pet ID:</b> P{petID}
                      </div>

                      <div className="mb-2 flex items-center">
                        <b className="mr-3">Pet Name:</b>{" "}
                        <button className="underline hover:text-blue-400" onClick={() => handleGoToPetProfile(petID)}>
                          {petName}
                        </button>
                      </div>

                      <div className="mb-2 flex items-center">
                        <b className="mr-3">Owner:</b>{" "}
                        <button className="underline hover:text-blue-400" onClick={() => handleGoToOwnerProfile(ownerID)}>
                          {firstName} {surname} (N{ownerID})
                        </button>
                      </div>

                      <div className="mb-2 flex items-center">
                        <b className="mr-3">Greater Area:</b> {greaterArea}
                      </div>

                      <div className="mb-2 flex items-center">
                        <b className="mr-3">Area:</b> {area}
                      </div>

                      <div className="mb-2 flex items-center">
                        <b className="mr-3">Category:</b> {categoryOption}
                      </div>

                      <div className="mb-2 flex items-center">
                        <b className="mr-3">Type(s):</b> {typeList.join("; ")}
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
          </>
        )}
      </main>
    </>
  );
};

export default Treatment;
