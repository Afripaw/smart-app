import { type NextPage } from "next";
import Head from "next/head";
import React, { SetStateAction, useEffect, useRef, useState } from "react";
import { api } from "~/utils/api";
import ReactToPrint from "react-to-print";
import Image from "next/image";
//Components
import Navbar from "../components/navbar";
import CreateButtonModal from "../components/createButtonModal";
import DeleteButtonModal from "~/components/deleteButtonModal";
import ImageUploadModal from "~/components/imageUploadModal";
import { areaOptions } from "~/components/GeoLocation/areaOptions";
import { areaStreetMapping } from "~/components/GeoLocation/areaStreetMapping";
import { clinicDates } from "~/components/clinicsAttended";

//Excel
import * as XLSX from "xlsx";

//File saver
import * as FileSaver from "file-saver";

//Icons
import { AddressBook, Pencil, Printer, Trash, UserCircle, Users, Bed } from "phosphor-react";

//Communication
import { sendSMS } from "~/pages/api/smsPortal";

//Date picker
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { UploadButton } from "~/utils/uploadthing";
import { useSession } from "next-auth/react";
import Input from "~/components/Base/Input";
import { bg } from "date-fns/locale";
import { set } from "date-fns";
import { greaterArea } from "@prisma/client";

const Volunteer: NextPage = () => {
  useSession({ required: true });

  const newVolunteer = api.volunteer.create.useMutation();
  const updateVolunteer = api.volunteer.update.useMutation();
  const [isUpdate, setIsUpdate] = useState(false);
  const [isCreate, setIsCreate] = useState(false);
  //Update the table when user is deleted
  const [isDeleted, setIsDeleted] = useState(false);

  //-------------------------------LOADING ANIMATIONS-----------------------------------------
  const [isLoading, setIsLoading] = useState(false);

  //-------------------------------COMMUNICATION OF VOLUNTEER DETAILS-----------------------------------------
  const [sendVolunteerDetails, setSendVolunteerDetails] = useState(false);

  //-------------------------------UPDATE IDENTIFICATION-----------------------------------------
  const updateIdentification = api.volunteer.updateIdentification.useMutation();

  //get latest volunteerID
  const latestVolunteerID = api.volunteer.getLatestVolunteerID.useQuery();

  //Excel upload
  const insertExcelData = api.volunteer.insertExcelData.useMutation();

  //---------------------------------BULK UPLOAD----------------------------------

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const bstr = event.target?.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0]; //[1]
      console.log("Sheet name: ", wsname);
      const ws: XLSX.WorkSheet | undefined = wb.Sheets[wsname as keyof typeof wb.Sheets];
      const data = ws ? XLSX.utils.sheet_to_json(ws) : [];
      console.log("Data: ", data);

      //This is the format that the insertExcelData mutation expects

      type volunteerData = {
        firstName: string;
        email: string;
        surname: string;
        mobile: string;
        //addressGreaterAreaID: number[]; // Array of strings
        addressStreet: string;
        addressStreetCode: string;
        addressStreetNumber: number;
        addressSuburb: string;
        addressPostalCode: string;
        addressFreeForm: string;
        preferredCommunication: string;
        role: string[]; // Array of strings
        status: string;
        startingDate: Date; // Or string if you are handling date as a string before conversion.
        //clinicAttended: number[]; // Array of numbers
        comments: string;
      };

      //change the data so that it gives me the correct format for each column as in the petOwnerData type
      for (const obj of data as volunteerData[]) {
        //Change the format of the date
        obj.startingDate = new Date(obj.startingDate);
        //change the format of the mobile number
        obj.mobile = obj.mobile.toString();

        // obj.addressStreetNumber = "";

        obj.addressStreetCode = "";

        obj.addressSuburb = "";

        obj.addressPostalCode = "";

        obj.addressStreet = "";

        //add an addressFreeForm column
        obj.addressFreeForm = "";

        //add a comments column
        obj.comments = "";

        //make addressGreaterArea an array
        //obj.addressGreaterArea = [String(obj.addressGreaterArea)];
        // obj.addressGreaterAreaID = [Number(obj.addressGreaterAreaID)];

        //check if email is empty
        if (obj.email === undefined || obj.email === null) {
          obj.email = "";
        }

        //check all the roles. They are a list seperated by commas. Get all the roles and put them in an array
        const roles = String(obj.role).split(",");
        obj.role = roles;
      }

      //Turn the data into this type of object: {firstName: "John", surname: "Doe", email: "xxxxxxx@xxxxx", mobile: "0712345678", address: "1 Main Road, Observatory, Cape Town, 7925", comments: "None"}

      insertExcelData.mutate(data as volunteerData[], {
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

  const convert_to_json = async (data: Array<Record<string, unknown>>) => {
    const rows: string[] = data.map((row) => JSON.stringify(row));
    console.log("Rows: ", rows);
  };

  //---------------------------------RANDOM DATE GENERATOR----------------------------------
  function getRandomDate(): Date {
    const start = new Date("2020-01-01T00:00:00Z").getTime(); // Start of January 2020
    const end = new Date("2024-02-29T23:59:59Z").getTime(); // End of February 2024 (leap year)

    // Generate a random timestamp between the start and end
    const randomTimestamp = start + Math.random() * (end - start);

    // Create a new Date object using the random timestamp
    return new Date(randomTimestamp);
  }

  const ownerStartingDate = api.volunteer.updateStartingDate.useMutation();
  const handleRandomDate = async (id: number) => {
    const date = getRandomDate();
    await ownerStartingDate.mutateAsync({ volunteerID: id, startingDate: date });
  };

  //-------------------------------EMAIL-----------------------------------------
  async function sendEmail(firstName: string, email: string, id: string, password: string, typeOfUser: string): Promise<void> {
    const response = await fetch("/api/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ firstName, email, id, password, typeOfUser }),
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

  //-------------------------------ID-----------------------------------------
  const [id, setID] = useState(0);
  //-------------------------------ORDER FIELDS-----------------------------------------
  //Order fields
  const [order, setOrder] = useState("surname");
  //-------------------------------VIEW PROFILE PAGE-----------------------------------------
  const [isViewProfilePage, setIsViewProfilePage] = useState(false);

  //-------------------------------GREATER AREA-----------------------------------------
  type GreaterArea = {
    id: number;
    area: string;
  };

  type GreaterAreaOptions = {
    id: number;
    area: string;
    state: boolean;
  };

  type GreaterAreaSelect = {
    allSelected: boolean;
    clear: boolean;
  };

  //------------------------------ROLES-----------------------------------------
  type RoleOptions = {
    role: string;
    state: boolean;
  };

  type RoleSelect = {
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

  //The list of clinics that the user has attended
  const [clinicList, setClinicList] = useState<Clinic[]>([]);
  //const [clinicIDList, setClinicIDList] = useState<number[]>([]);

  //Done uploading
  const [isDoneUploading, setIsDoneUploading] = useState(false);

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
      volunteerID: id,
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
  const clinics_data = queryData?.pages.flatMap((page) => page.clinics_data);
  const greater_area_data = queryData?.pages.flatMap((page) => page.greater_areas_data);
  const volunteer_data_with_clinics = user_data?.map((volunteer) => {
    // Assuming each clinic object has a 'petID' that links it to a pet
    const associatedClinics = clinics_data?.filter((clinic) => clinic.volunteerID === volunteer.volunteerID);
    const associatedGreaterAreas = greater_area_data?.filter((area) => area.volunteerID === volunteer.volunteerID);

    return {
      ...volunteer,
      clinics: associatedClinics,
      greaterAreas: associatedGreaterAreas,
    };
  });

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

  //Make it retrieve the data from tab;e again when the user is updated, deleted or created
  useEffect(() => {
    void refetch();
  }, [isUpdate, isDeleted, isCreate, query, order, isViewProfilePage, clinicList, isDoneUploading]);

  const user = volunteer_data_with_clinics?.find((volunteer) => volunteer.volunteerID === id);

  //-------------------------------DELETE ALL USERS-----------------------------------------
  //Delete all users
  const deleteAllUsers = api.volunteer.deleteAllVolunteers.useMutation();
  const handleDeleteAllUsers = async () => {
    await deleteAllUsers.mutateAsync();
    isDeleted ? setIsDeleted(false) : setIsDeleted(true);
  };

  //---------------------------------PRINTING----------------------------------
  const printComponentRef = useRef(null);

  //---------------------------------EDIT BOXES----------------------------------
  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [southAfricanID, setSouthAfricanID] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [street, setStreet] = useState("");
  const [addressFreeForm, setAddressFreeForm] = useState("");
  const [addressStreetCode, setAddressStreetCode] = useState("");
  const [addressStreetNumber, setAddressStreetNumber] = useState(0);
  const [addressSuburb, setAddressSuburb] = useState("");
  const [addressPostalCode, setAddressPostalCode] = useState("");
  const [comments, setComments] = useState("");
  const [startingDate, setStartingDate] = useState(new Date());
  const [image, setImage] = useState("");
  const [collaboratorOrg, setCollaboratorOrg] = useState("");

  //userID
  //const [userID, setUserID] = useState("");
  //const [id, setID] = useState(0);

  //-------------------------------UPDATE USER-----------------------------------------
  // const user = api.volunteer.getVolunteerByID.useQuery({ volunteerID: id });

  //Order fields
  // const [order, setOrder] = useState("surname");
  //Add clinic to pet
  const addClinic = api.volunteer.addClinicToVolunteer.useMutation();

  //--------------------------------CREATE NEW USER DROPDOWN BOXES--------------------------------
  //WEBHOOKS FOR DROPDOWN BOXES
  const [isGreaterAreaOpen, setIsGreaterAreaOpen] = useState(false);
  const [greaterAreaOption, setGreaterAreaOption] = useState("Select here");
  const greaterAreaRef = useRef<HTMLDivElement>(null);
  const btnGreaterAreaRef = useRef<HTMLButtonElement>(null);

  const [isRoleOpen, setIsRoleOpen] = useState(false);
  const [roleOption, setRoleOption] = useState("Select here");
  const roleRef = useRef<HTMLDivElement>(null);
  const btnRoleRef = useRef<HTMLButtonElement>(null);

  const [preferredCommunication, setPreferredCommunication] = useState(false);
  const [preferredOption, setPreferredCommunicationOption] = useState("Select one");
  const preferredCommunicationRef = useRef<HTMLDivElement>(null);
  const btnPreferredCommunicationRef = useRef<HTMLButtonElement>(null);

  const [status, setStatus] = useState(false);
  const [statusOption, setStatusOption] = useState("Select one");
  const statusRef = useRef<HTMLDivElement>(null);
  const btnStatusRef = useRef<HTMLButtonElement>(null);

  const [isSouthAfricanIDOpen, setIsSouthAfricanIDOpen] = useState(false);
  const [southAfricanIDOption, setSouthAfricanIDOption] = useState("Select one");
  const southAfricanIDRef = useRef<HTMLDivElement>(null);
  const btnSouthAfricanIDRef = useRef<HTMLButtonElement>(null);

  //GREATER AREA
  //to select multiple areas
  const [greaterAreaList, setGreaterAreaList] = useState<GreaterArea[]>([]);

  const [greaterAreaListOptions, setGreaterAreaListOptions] = useState<GreaterAreaOptions[]>([]);
  const [greaterAreaSelection, setGreaterAreaSelection] = useState<GreaterAreaSelect>();

  const handleToggleGreaterArea = () => {
    setIsGreaterAreaOpen(!isGreaterAreaOpen);
  };

  const handleGreaterArea = (id: number, option: SetStateAction<string>, state: boolean, selectionCategory: string) => {
    if (selectionCategory === "allSelected") {
      setGreaterAreaOption("Select All");
      setGreaterAreaSelection({ allSelected: state, clear: false });

      const greaterAreas = greaterAreaListOptions.map((area) => ({
        id: area.id,
        area: area.area,
      }));
      setGreaterAreaList(greaterAreas);
      //order the greaterAreaList from smallest to largest id
      setGreaterAreaList(greaterAreaList.sort((a, b) => a.id - b.id));
      setGreaterAreaListOptions(greaterAreaListOptions.map((area) => ({ ...area, state: true })));
    } else if (selectionCategory === "clear") {
      setGreaterAreaOption("Clear All");
      setGreaterAreaSelection({ allSelected: false, clear: state });

      setGreaterAreaList([]);
      setGreaterAreaListOptions(greaterAreaListOptions.map((area) => ({ ...area, state: false })));
    } else if (selectionCategory === "normal") {
      setGreaterAreaOption(option);
      setGreaterAreaSelection({ allSelected: false, clear: false });
      if (state) {
        const area: GreaterArea = {
          id: id,
          area: String(option),
        };
        const greaterAreaIDList = greaterAreaList.map((area) => area.id);
        if (!greaterAreaIDList.includes(id)) {
          setGreaterAreaList([...greaterAreaList, area]);

          //order the greaterAreaList from smallest to largest id
          // console.log(
          //   "Sorted Greater Areas!!!: ",
          //   greaterAreaList.sort((a, b) => a.id - b.id),
          // );
          // setGreaterAreaList(greaterAreaList.sort((a, b) => a.id - b.id));
        }
        setGreaterAreaListOptions(greaterAreaListOptions.map((area) => (area.id === id ? { ...area, state: true } : area)));

        // console.log("Greater Area list: ", greaterAreaList);
        // console.log("Greater Area List Options: ", greaterAreaListOptions);
      } else {
        const updatedGreaterAreaList = greaterAreaList.filter((area) => area.id !== id);
        //setGreaterAreaList(updatedGreaterAreaList);

        //order the greaterAreaList from smallest to largest id
        setGreaterAreaList(updatedGreaterAreaList.sort((a, b) => a.id - b.id));
        setGreaterAreaListOptions(greaterAreaListOptions.map((area) => (area.id === id ? { ...area, state: false } : area)));
        // console.log("Greater Area list: ", greaterAreaList);
        // console.log("Greater Area List Options: ", greaterAreaListOptions);
      }
    }
  };

  //----------------------ORIGINAL CODE-------------------------
  // const handleGreaterAreaOption = (option: SetStateAction<string>, id: number) => {
  //   setGreaterAreaOption(option);
  //   setIsGreaterAreaOpen(false);

  //   const area: GreaterArea = {
  //     id: id,
  //     area: String(option),
  //   };
  //   if (!greaterAreaList.includes(area)) {
  //     setGreaterAreaList([...greaterAreaList, area]);
  //   }
  // };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        greaterAreaRef.current &&
        !greaterAreaRef.current.contains(event.target as Node) &&
        btnGreaterAreaRef.current &&
        !btnGreaterAreaRef.current.contains(event.target as Node)
      ) {
        setIsGreaterAreaOpen(false);
        console.log("Greater Area list: ", greaterAreaList);
        console.log("Greater Area List Options: ", greaterAreaListOptions);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const greaterAreaOptions = api.geographic.getAllGreaterAreas.useQuery()?.data ?? [];

  //ADDRESS STREET NUMBER
  const handleAddressStreetNumber = (e: string) => {
    setAddressStreetNumber(Number(e));
  };

  //Old code
  // //show all the clinics that the volunteer attended
  // const [showGreaterArea, setShowGreaterArea] = useState(false);
  // const handleShowGreaterArea = () => {
  //   setShowGreaterArea(!showGreaterArea);
  // };

  //ROLE

  //const [greaterAreaListOptions, setGreaterAreaListOptions] = useState<GreaterAreaOptions[]>([]);
  const [roleListOptions, setRoleListOptions] = useState<RoleOptions[]>([]);
  const [roleSelection, setRoleSelection] = useState<RoleSelect>();
  //to select multiple roles
  const [roleList, setRoleList] = useState<string[]>([]);
  const handleToggleRole = () => {
    setIsRoleOpen(!isRoleOpen);
  };

  const handleRole = (option: SetStateAction<string>, state: boolean, selectionCategory: string) => {
    if (selectionCategory === "allSelected") {
      setRoleOption("Select All");
      setRoleSelection({ allSelected: state, clear: false });

      const roles = roleListOptions.map((role) => role.role);
      setRoleList(roles);
      //order the roleList in alphabetical order
      // setRoleList(roleList.sort((a, b) => a.localeCompare(b)));
      setRoleListOptions(roleListOptions.map((role) => ({ ...role, state: true })));
    } else if (selectionCategory === "clear") {
      setRoleOption("Clear All");
      setRoleSelection({ allSelected: false, clear: state });

      setRoleList([]);
      setRoleListOptions(roleListOptions.map((role) => ({ ...role, state: false })));
    } else if (selectionCategory === "normal") {
      setRoleOption(option);
      setRoleSelection({ allSelected: false, clear: false });
      if (state) {
        if (!roleList.includes(String(option))) {
          setRoleList([...roleList, String(option)]);
          //order the roleList in alphabetical order
          // setRoleList(roleList.sort((a, b) => a.localeCompare(b)));
        }

        setRoleListOptions(roleListOptions.map((role) => (role.role === option ? { ...role, state: true } : role)));
        // console.log("Greater Area list: ", greaterAreaList);
        // console.log("Greater Area List Options: ", greaterAreaListOptions);
      } else {
        const updatedRoleList = roleList.filter((role) => role !== option);
        setRoleList(updatedRoleList);
        //order the roleList in alphabetical order
        // setRoleList(roleList.sort((a, b) => a.localeCompare(b)));
        setRoleListOptions(roleListOptions.map((role) => (role.role === option ? { ...role, state: false } : role)));
        // console.log("Greater Area list: ", greaterAreaList);
        // console.log("Greater Area List Options: ", greaterAreaListOptions);
      }
    }
  };

  // const handleRoleOption = (option: SetStateAction<string>) => {
  //   setRoleOption(option);
  //   setIsRoleOpen(false);
  //   if (!roleList.includes(String(option))) {
  //     setRoleList([...roleList, String(option)]);
  //   }
  // };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (roleRef.current && !roleRef.current.contains(event.target as Node) && btnRoleRef.current && !btnRoleRef.current.contains(event.target as Node)) {
        setIsRoleOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const roleOptions = [
    "Ambassador",
    "Board Member",
    "Foster",
    "Groomer",
    "Marketing",
    "Pet Clinic Administrator",
    "Pet Clinic Cats",
    "Pet Clinic Director",
    "Pet Clinic General",
    "Pet Clinic Hospital",
    "Programme Co-ordinator",
    "Vet",
    "Vet Nurse",
    "Walker",
    "Ward Councillor",
    "Young Ambassador",
    "Other",
  ];

  // const [showRole, setShowRole] = useState(false);
  // const handleShowRole = () => {
  //   setShowRole(!showRole);
  // };

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

  // const [preferredCommunicationOptions, setPreferredCommunicationOptions] = useState(["SMS"]);
  // useEffect(() => {
  //   if (email === "") {
  //     setPreferredCommunicationOptions(["SMS"]);
  //   } else if (email != "") {
  //     setPreferredCommunicationOptions(["Email", "SMS"]);
  //   }
  // }, [email]);
  const [preferredCommunicationOptions, setPreferredCommunicationOptions] = useState<string[]>([]);

  useEffect(() => {
    if (email === "" && mobile === "") {
      setPreferredCommunicationOptions([]);
    } else if (email != "" && mobile === "") {
      setPreferredCommunicationOptions(["Email"]);
    } else if (email === "" && mobile != "") {
      setPreferredCommunicationOptions(["SMS"]);
    } else if (email != "" && mobile != "") {
      setPreferredCommunicationOptions(["Email", "SMS"]);
    }
  }, [email, mobile]);

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

  //SOUTH AFRICAN ID
  const handleToggleSouthAfricanID = () => {
    setIsSouthAfricanIDOpen(!isSouthAfricanIDOpen);
  };

  const handleSouthAfricanIDOption = (option: SetStateAction<string>) => {
    setSouthAfricanIDOption(option);
    setIsSouthAfricanIDOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        southAfricanIDRef.current &&
        !southAfricanIDRef.current.contains(event.target as Node) &&
        btnSouthAfricanIDRef.current &&
        !btnSouthAfricanIDRef.current.contains(event.target as Node)
      ) {
        setIsSouthAfricanIDOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const southAfricanIDOptions = ["Yes", "Unknown", "No ID"];

  //CLINICSATTENDED

  const [clinicListOptions, setClinicListOptions] = useState<ClinicOptions[]>([]);
  const [clinicSelection, setClinicSelection] = useState<ClinicSelect>();

  //All clinics in petClinic table
  const clinicsAttendedOptions = api.petClinic.getAllClinics.useQuery().data ?? [];

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
    if ((yearA ?? 0) !== (yearB ?? 0)) return (yearA ?? 0) - (yearB ?? 0);
    if (monthA !== monthB) return (monthA ?? 0) - (monthB ?? 0);
    return (dayA ?? 0) - (dayB ?? 0);
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

      console.log("Clinics!!!!: ", clinics);
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
        console.log(
          "Updated Clinic List: ",
          clinicList.filter((clinic) => clinic.id !== id),
        );
        // setClinicList(updatedClinicList);

        //order the greaterAreaList from smallest to largest id
        setClinicList(updatedClinicList.sort((a, b) => a.id - b.id));
        setClinicListOptions(clinicListOptions.map((clinic) => (clinic.id === id ? { ...clinic, state: false } : clinic)));
        // console.log("Greater Area list: ", greaterAreaList);
        // console.log("Greater Area List Options: ", greaterAreaListOptions);
        console.log("Helloooo Clinic List___: ", clinicList);
      }
      console.log("Clinic List___: ", clinicList);
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

  //----------------------------COMMUNICATION OF USER DETAILS---------------------------
  //Send user's details to user
  //const [sendUserDetails, setSendUserDetails] = useState(false);

  //-------------------------------UPDATE USER-----------------------------------------
  //Update the user's details in fields
  const handleUpdateUserProfile = async (id: number) => {
    setID(id);
    const user = volunteer_data_with_clinics?.find((volunteer) => volunteer.volunteerID === id);
    if (user) {
      // Assuming userQuery.data contains the user object
      const userData = user;

      console.log("User Data!!!!!: ", userData);

      const clinicData = user?.clinics;
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

      const greaterAreaData = user?.greaterAreas;
      const greaterAreas: GreaterArea[] =
        greaterAreaData?.map((area) => ({
          id: area.greaterAreaID,
          area: area.greaterArea.greaterArea,
        })) ?? [];

      if (userData.southAfricanID === "No ID") {
        setSouthAfricanIDOption("No ID");
      } else if (userData.southAfricanID === "Unknown") {
        setSouthAfricanIDOption("Unknown");
        //else if the user has a valid South African ID with just number and 13 digits
      } else if (userData.southAfricanID !== null ? userData.southAfricanID.match(/^\d{13}$/) : false) {
        setSouthAfricanIDOption("Yes");
        setSouthAfricanID(userData.southAfricanID ?? "");
      }

      setID(userData.volunteerID ?? 0);
      setFirstName(userData.firstName ?? "");
      setSurname(userData.surname ?? "");
      setEmail(userData.email ?? "");
      setMobile(userData.mobile ?? "");
      setGreaterAreaList(greaterAreas ?? "Select here");
      setStreet(userData.addressStreet ?? "");
      setAddressStreetCode(userData.addressStreetCode ?? "");
      setAddressStreetNumber(userData.addressStreetNumber ?? 0);
      setAddressSuburb(userData.addressSuburb ?? "");
      setAddressPostalCode(userData.addressPostalCode ?? "");
      setPreferredCommunicationOption(userData.preferredCommunication ?? "Select one");
      setStartingDate(userData.startingDate ?? new Date());
      setStatusOption(userData.status ?? "Select one");
      setComments(userData.comments ?? "");
      setRoleList(userData.role ?? "Select here");
      setCollaboratorOrg(userData.collaboratorOrg ?? "");
      setClinicList(clinicDates);

      const greaterAreasIDs = greaterAreas.map((area) => area.id);

      setGreaterAreaListOptions(
        greaterAreaOptions.map((area) => ({
          id: area.greaterAreaID,
          area: area.greaterArea,
          state: greaterAreasIDs.includes(area.greaterAreaID),
        })),
      );

      setRoleListOptions(
        roleOptions.map((role) => ({
          role: role,
          state: userData.role.includes(role),
        })),
      );

      setClinicListOptions(
        clinicsAttendedOptions.map((clinic) => ({
          id: clinic.clinicID,
          date: clinic.date.getDate().toString() + "/" + ((clinic.date.getMonth() ?? 0) + 1).toString() + "/" + clinic.date.getFullYear().toString(),
          area: clinic.greaterArea.greaterArea,
          state: clinicDates.map((clinic) => clinic.id).includes(clinic.clinicID),
        })),
      );
      // console.log("Update Clinic list: ", clinicDates);
      //setClinicIDList(clinicIDs);
    }

    //isUpdate ? setIsUpdate(true) : setIsUpdate(true);
    //isCreate ? setIsCreate(false) : setIsCreate(false);
    setIsUpdate(true);
    setIsCreate(false);
  };

  useEffect(() => {
    if (user) {
      // Assuming userQuery.data contains the user object
      const userData = user;
      const clinicData = user?.clinics;
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

      const greaterAreaData = user?.greaterAreas;
      const greaterAreas: GreaterArea[] =
        greaterAreaData?.map((area) => ({
          id: area.greaterAreaID,
          area: area.greaterArea.greaterArea,
        })) ?? [];

      // console.log("Hellllllooooo!  Clinic area: ", clinicData?.map((clinic) => clinic.clinic.area) ?? []);

      setID(userData.volunteerID ?? 0);
      setFirstName(userData.firstName ?? "");
      setSurname(userData.surname ?? "");
      setEmail(userData.email ?? "");
      setMobile(userData.mobile ?? "");
      setGreaterAreaList(greaterAreas ?? "Select here");
      setStreet(userData.addressStreet ?? "");
      setAddressFreeForm(userData.addressFreeForm ?? "");
      setAddressStreetCode(userData.addressStreetCode ?? "");
      setAddressStreetNumber(userData.addressStreetNumber ?? 0);
      setAddressSuburb(userData.addressSuburb ?? "");
      setAddressPostalCode(userData.addressPostalCode ?? "");
      setPreferredCommunicationOption(userData.preferredCommunication ?? "Select one");
      setStartingDate(userData.startingDate ?? new Date());
      setStatusOption(userData.status ?? "Select one");
      setComments(userData.comments ?? "");
      setCollaboratorOrg(userData.collaboratorOrg ?? "");
      setClinicList(clinicDates);
      setRoleList(userData.role ?? "Select here");

      if (userData.southAfricanID === "No ID") {
        setSouthAfricanIDOption("No ID");
      } else if (userData.southAfricanID === "Unknown") {
        setSouthAfricanIDOption("Unknown");
        //else if the user has a valid South African ID with just number and 13 digits
        //}else if (userData?.southAfricanID?.match(/^\d{13}$/)){
      } else if (userData.southAfricanID?.match(/^\d{13}$/)) {
        setSouthAfricanIDOption("Yes");
        setSouthAfricanID(userData?.southAfricanID ?? "");
      }

      setGreaterAreaListOptions(
        greaterAreaOptions.map((area) => ({
          id: area.greaterAreaID,
          area: area.greaterArea,
          state: greaterAreas.map((area) => area.id).includes(area.greaterAreaID),
        })),
      );

      console.log(
        "Update or create Greater Area list: ",
        greaterAreaOptions.map((area) => ({
          id: area.greaterAreaID,
          area: area.greaterArea,
          state: greaterAreas.map((area) => area.id).includes(area.greaterAreaID),
        })),
      );

      setRoleListOptions(
        roleOptions.map((role) => ({
          role: role,
          state: userData.role.includes(role),
        })),
      );

      console.log(
        "Update or create Role list: ",
        roleOptions.map((role) => ({
          role: role,
          state: userData.role.includes(role),
        })),
      );

      setClinicListOptions(
        clinicsAttendedOptions.map((clinic) => ({
          id: clinic.clinicID,
          date: clinic.date.getDate().toString() + "/" + ((clinic.date.getMonth() ?? 0) + 1).toString() + "/" + clinic.date.getFullYear().toString(),
          area: clinic.greaterArea.greaterArea,
          state: clinicDates.map((clinic) => clinic.id).includes(clinic.clinicID),
        })),
      );
      console.log(
        "Update or create Clinic list: ",
        clinicsAttendedOptions.map((clinic) => ({
          id: clinic.clinicID,
          date: clinic.date.getDate().toString() + "/" + ((clinic.date.getMonth() ?? 0) + 1).toString() + "/" + clinic.date.getFullYear().toString(),
          area: clinic.area?.area ?? "",
          state: clinicDates.map((clinic) => clinic.id).includes(clinic.clinicID),
        })),
      );
      //setClinicIDList(clinicIDs);
      // setClinicList(userData.clinicsAttended ?? []);
    }
  }, [isUpdate, isCreate]); // Effect runs when userQuery.data changes

  const handleUpdateUser = async () => {
    setIsLoading(true);
    const clinicIDList = clinicList.sort((a, b) => a.id - b.id).map((clinic) => (clinic.id ? clinic.id : 0));
    console.log("Helloo!! Clinic ID List: ", clinicIDList);
    const greaterAreaIDList = greaterAreaList.sort((a, b) => a.id - b.id).map((area) => (area.id ? area.id : 0));
    const volunteer = await updateVolunteer.mutateAsync({
      volunteerID: id,
      firstName: firstName,
      email: email ? email : "",
      surname: surname,
      southAfricanID: southAfricanIDOption === "Yes" ? southAfricanID : southAfricanIDOption,
      mobile: mobile ? mobile : "",
      addressGreaterAreaID: greaterAreaIDList,
      addressStreet: street,
      addressStreetCode: addressStreetCode,
      addressStreetNumber: addressStreetNumber,
      addressSuburb: addressSuburb,
      addressPostalCode: addressPostalCode,
      addressFreeForm: addressFreeForm,
      //role: roleList,
      role: roleList.sort((a, b) => a.localeCompare(b)),
      collaboratorOrg: collaboratorOrg,
      preferredCommunication: preferredOption === "Select one" ? "" : preferredOption,
      startingDate: startingDate,
      status: statusOption === "Select one" ? "" : statusOption,
      clinicAttended: clinicIDList,
      comments: comments,
    });

    if (preferredOption === "Email" && sendVolunteerDetails && volunteer?.volunteerID) {
      await sendEmail(firstName, email, String(volunteer.volunteerID), "", "volunteer");
    }

    if (preferredOption === "SMS" && sendVolunteerDetails && volunteer?.volunteerID) {
      const messageContent =
        "Dear " +
        firstName +
        ",\n" +
        "You have been registered as a volunteer on the AfriPaw Smart App." +
        "\nYour volunteer ID is: " +
        "V" +
        id +
        "\n" +
        // "You indicated that your preferred means of communication is: SMS" +
        // "\n" +
        "Regards, AfriPaw Team";
      //const messageContent = "Afripaw Smart App Login Credentials"+"\n\n"+"Dear "+firstName+". Congratulations! You have been registered as a user on the Afripaw Smart App.";
      const destinationNumber = mobile;
      try {
        await sendSMS(messageContent, destinationNumber);
        console.log("SMS sent successfully");
      } catch (error) {
        console.error("Failed to send SMS", error);
      }
    }

    //After the newUser has been created make sure to set the fields back to empty
    setSouthAfricanIDOption("Select one");
    setSouthAfricanID("");
    setFirstName("");
    setEmail("");
    setSurname("");
    setMobile("");
    setGreaterAreaOption("Select here");
    setRoleOption("Select here");
    setStartingDate(new Date());
    setClinicsAttendedOption("Select here");
    setStreet("");
    setAddressStreetCode("");
    setAddressStreetNumber(0);
    setAddressSuburb("");
    setAddressPostalCode("");
    setAddressFreeForm("");
    setPreferredCommunicationOption("Select one");
    setStatusOption("Select one");
    setComments("");
    setCollaboratorOrg("");
    setClinicList([]);
    setRoleList([]);
    setGreaterAreaList([]);
    setIsUpdate(false);
    setIsCreate(false);
    setIsLoading(false);
  };

  //-------------------------------CREATE NEW USER-----------------------------------------

  const handleCreateNewUser = async () => {
    setGreaterAreaOption("Select here");
    setRoleOption("Select here");
    setClinicsAttendedOption("Select here");
    setStreet("");
    setPreferredCommunicationOption("Select one");
    setStatusOption("Active");
    setStartingDate(new Date());
    setComments("");
    setCollaboratorOrg("");
    setFirstName("");
    setSouthAfricanIDOption("Select one");
    setSouthAfricanID("");
    setEmail("");
    setSurname("");
    setMobile("");
    setAddressStreetCode("");
    setAddressStreetNumber(0);
    setAddressSuburb("");
    setAddressPostalCode("");
    setAddressFreeForm("");
    //isCreate ? setIsCreate(false) : setIsCreate(true);
    setClinicList([]);

    setGreaterAreaListOptions(greaterAreaOptions.map((area) => ({ id: area.greaterAreaID, area: area.greaterArea, state: false })));
    setRoleListOptions(roleOptions.map((role) => ({ role: role, state: false })));
    setClinicListOptions(
      clinicsAttendedOptions.map((clinic) => ({
        id: clinic.clinicID,
        date: clinic.date.getDate().toString() + "/" + ((clinic.date.getMonth() ?? 0) + 1).toString() + "/" + clinic.date.getFullYear().toString(),
        area: clinic.greaterArea.greaterArea,
        state: false,
      })),
    );

    //setClinicIDList([]);
    setIsCreate(true);
    setIsUpdate(false);
  };
  //-------------------------------NEW USER-----------------------------------------

  const handleNewUser = async () => {
    setIsLoading(true);
    const clinicIDList = clinicList.sort((a, b) => a.id - b.id).map((clinic) => (clinic.id ? clinic.id : 0));
    const greaterAreaIDList = greaterAreaList.sort((a, b) => a.id - b.id).map((area) => (area.id ? area.id : 0));
    try {
      const newUser_ = await newVolunteer.mutateAsync({
        firstName: firstName,
        email: email ? email : "",
        surname: surname,
        southAfricanID: southAfricanIDOption === "Yes" ? southAfricanID : southAfricanIDOption,
        mobile: mobile ? mobile : "",
        addressGreaterAreaID: greaterAreaIDList,
        addressStreet: street,
        addressStreetCode: addressStreetCode,
        addressStreetNumber: addressStreetNumber,
        addressSuburb: addressSuburb,
        addressPostalCode: addressPostalCode,
        addressFreeForm: addressFreeForm,
        role: roleList.sort((a, b) => a.localeCompare(b)),
        collaboratorOrg: collaboratorOrg,
        preferredCommunication: preferredOption === "Select one" ? "" : preferredOption,
        startingDate: startingDate,
        status: statusOption === "Select one" ? "" : statusOption,
        clinicAttended: clinicIDList,
        comments: comments,
      });

      if (preferredOption === "Email" && sendVolunteerDetails && newUser_?.volunteerID) {
        await sendEmail(firstName, email, String(newUser_.volunteerID), "", "volunteer");
      }

      if (preferredOption === "SMS" && sendVolunteerDetails && newUser_?.volunteerID) {
        const messageContent =
          "Dear " +
          firstName +
          ",\n" +
          "You have been registered as a volunteer on the AfriPaw Smart App." +
          "\nYour volunteer ID is: " +
          "V" +
          newUser_?.volunteerID +
          "\n" +
          "You indicated that your preferred means of communication is: SMS" +
          "\n" +
          "Regards, AfriPaw Team";
        //const messageContent = "Afripaw Smart App Login Credentials"+"\n\n"+"Dear "+firstName+". Congratulations! You have been registered as a user on the Afripaw Smart App.";
        const destinationNumber = mobile;
        try {
          await sendSMS(messageContent, destinationNumber);
          console.log("SMS sent successfully");
        } catch (error) {
          console.error("Failed to send SMS", error);
        }
      }

      //Image upload
      //console.log("ID: ", newUser_?.volunteerID, "Image: ", newUser_?.image, "Name: ", firstName, "IsUploadModalOpen: ", isUploadModalOpen);
      //console.log("Clinics attended: ", newUser_.clinicsAttended);
      handleUploadModal(newUser_.volunteerID, firstName, newUser_?.image ?? "");
      setIsCreate(false);
      setIsUpdate(false);

      //update identification table
      if (newUser_?.volunteerID) {
        await updateIdentification.mutateAsync({
          volunteerID: newUser_?.volunteerID ?? 0,
        });
      }
    } catch (error) {
      console.log("Mobile number is already in database");
      const mandatoryFields: string[] = [];
      const errorFields: { field: string; message: string }[] = [];

      errorFields.push({ field: "Mobile", message: "This mobile number is already in the database: " + mobile });

      setMandatoryFields(mandatoryFields);
      setErrorFields(errorFields);

      if (mandatoryFields.length > 0 || errorFields.length > 0) {
        setIsCreateButtonModalOpen(true);
      }
    }
    setIsLoading(false);
    // return newUser_;
  };

  //-------------------------------VIEW PROFILE PAGE-----------------------------------------
  // const [isViewProfilePage, setIsViewProfilePage] = useState(false);
  const handleViewProfilePage = async (id: number) => {
    setIsViewProfilePage(true);
    setID(id);
    const user = volunteer_data_with_clinics?.find((volunteer) => volunteer.volunteerID === id);
    // console.log("View profile page: ", JSON.stringify(user));
    if (user) {
      // Assuming userQuery.data contains the user object
      const userData = user;
      //Get all the clinic dates and put in a string array
      const clinicData = user?.clinics;
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

      const greaterAreaData = user?.greaterAreas;
      const greaterAreas: GreaterArea[] =
        greaterAreaData?.map((area) => ({
          id: area.greaterAreaID,
          area: area.greaterArea.greaterArea,
        })) ?? [];

      if (userData.southAfricanID === "No ID") {
        setSouthAfricanIDOption("No ID");
      } else if (userData.southAfricanID === "Unknown") {
        setSouthAfricanIDOption("Unknown");
        //else if the user has a valid South African ID with just number and 13 digits
      } else if (userData.southAfricanID?.match(/^\d{13}$/)) {
        setSouthAfricanIDOption("Yes");
        setSouthAfricanID(userData.southAfricanID ?? "");
      }

      setID(userData.volunteerID ?? 0);
      setFirstName(userData.firstName ?? "");
      setSurname(userData.surname ?? "");
      setEmail(userData.email ?? "");
      setMobile(userData.mobile ?? "");
      setGreaterAreaList(greaterAreas ?? "");
      setStreet(userData.addressStreet ?? "");
      setAddressStreetCode(userData.addressStreetCode ?? "");
      setAddressStreetNumber(userData.addressStreetNumber ?? 0);
      setAddressSuburb(userData.addressSuburb ?? "");
      setAddressPostalCode(userData.addressPostalCode ?? "");
      setAddressFreeForm(userData.addressFreeForm ?? "");
      setPreferredCommunicationOption(userData.preferredCommunication ?? "");
      setStartingDate(userData.startingDate ?? new Date());
      setStatusOption(userData.status ?? "");
      setComments(userData.comments ?? "");
      setRoleList(userData.role ?? "");
      setCollaboratorOrg(userData.collaboratorOrg ?? "");
      console.log("Select one");
      setClinicList(clinicDates);
      console.log("View profile Clinic list: ", clinicDates);
      //setClinicIDList(clinicIDs);
      //setClinicList(userData. ?? []);

      setGreaterAreaListOptions(
        greaterAreaOptions.map((area) => ({
          id: area.greaterAreaID,
          area: area.greaterArea,
          state: greaterAreas.map((area) => area.id).includes(area.greaterAreaID),
        })),
      );

      setRoleListOptions(
        roleOptions.map((role) => ({
          role: role,
          state: userData.role.includes(role),
        })),
      );

      setClinicListOptions(
        clinicsAttendedOptions.map((clinic) => ({
          id: clinic.clinicID,
          date: clinic.date.getDate().toString() + "/" + ((clinic.date.getMonth() ?? 0) + 1).toString() + "/" + clinic.date.getFullYear().toString(),
          area: clinic.greaterArea.greaterArea,
          state: clinicDates.map((clinic) => clinic.id).includes(clinic.clinicID),
        })),
      );
    }

    setIsUpdate(false);
    setIsCreate(false);
    setIsViewProfilePage(true);
  };

  useEffect(() => {
    if (isViewProfilePage) {
      // void user.refetch();
    }

    //console.log("View profile page: ", JSON.stringify(user.data));
    if (user) {
      const userData = user;
      const clinicData = user?.clinics;
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

      const greaterAreaData = user?.greaterAreas;
      const greaterAreas: GreaterArea[] =
        greaterAreaData?.map((area) => ({
          id: area.greaterAreaID,
          area: area.greaterArea.greaterArea,
        })) ?? [];

      if (userData.southAfricanID === "No ID") {
        setSouthAfricanIDOption("No ID");
      } else if (userData.southAfricanID === "Unknown") {
        setSouthAfricanIDOption("Unknown");
        //else if the user has a valid South African ID with just number and 13 digits
      } else if (userData.southAfricanID?.match(/^\d{13}$/)) {
        setSouthAfricanIDOption("Yes");
        setSouthAfricanID(userData.southAfricanID ?? "");
      }

      setFirstName(userData.firstName ?? "");
      setSurname(userData.surname ?? "");
      setEmail(userData.email ?? "");
      setMobile(userData.mobile ?? "");
      setGreaterAreaList(greaterAreas ?? "");
      setStreet(userData.addressStreet ?? "");
      setAddressStreetCode(userData.addressStreetCode ?? "");
      setAddressStreetNumber(userData.addressStreetNumber ?? 0);
      setAddressSuburb(userData.addressSuburb ?? "");
      setAddressPostalCode(userData.addressPostalCode ?? "");
      setPreferredCommunicationOption(userData.preferredCommunication ?? "");
      setStartingDate(userData.startingDate ?? new Date());
      setStatusOption(userData.status ?? "");
      setComments(userData.comments ?? "");
      setRoleList(userData.role ?? "");
      setCollaboratorOrg(userData.collaboratorOrg ?? "");
      setClinicList(clinicDates);
      console.log("View profile Clinic list: ", clinicDates);
      //setClinicIDList(clinicIDs);
      //setClinicList(userData.clinicsAttended ?? []);
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
    setIsUploadModalOpen(false);
    setID(0);
    setFirstName("");
    setEmail("");
    setSurname("");
    setSouthAfricanIDOption("Select one");
    setSouthAfricanID("");
    setMobile("");
    setGreaterAreaOption("Select here");
    setRoleOption("Select here");
    setStartingDate(new Date());
    setClinicsAttendedOption("Select here");
    setStreet("");
    setAddressStreetCode("");
    setAddressStreetNumber(0);
    setAddressSuburb("");
    setAddressPostalCode("");
    setPreferredCommunicationOption("Select one");
    setStatusOption("Select one");
    setComments("");
    setCollaboratorOrg("");
    setClinicList([]);
    setRoleList([]);
    setGreaterAreaList([]);
    setGreaterAreaSelection({ allSelected: false, clear: false });
    setRoleSelection({ allSelected: false, clear: false });
    setClinicSelection({ allSelected: false, clear: false });

    setClinicListOptions(
      clinicsAttendedOptions.map((clinic) => ({
        id: clinic.clinicID,
        date: clinic.date.getDate().toString() + "/" + ((clinic.date.getMonth() ?? 0) + 1).toString() + "/" + clinic.date.getFullYear().toString(),
        area: clinic.greaterArea.greaterArea,
        state: false,
      })),
    );

    setRoleListOptions(roleOptions.map((role) => ({ role: role, state: false })));

    setGreaterAreaListOptions(greaterAreaOptions.map((area) => ({ id: area.greaterAreaID, area: area.greaterArea, state: false })));
  };

  //-----------------------------PREVENTATIVE ERROR MESSAGES---------------------------
  //South African ID
  const [southAfricanIDMessage, setSouthAfricanIDMessage] = useState("");
  useEffect(() => {
    console.log(southAfricanID.length);
    if (southAfricanID.match(/^[0-9]+$/) == null && southAfricanID.length != 0) {
      setSouthAfricanIDMessage("ID must only contain numbers");
    } else if (southAfricanID.length != 13 && southAfricanID.length != 0) {
      setSouthAfricanIDMessage("ID must be 13 digits");
    } else {
      setSouthAfricanIDMessage("");
    }
  }, [southAfricanID]);

  //Mobile number
  const [mobileMessage, setMobileMessage] = useState("");
  useEffect(() => {
    console.log(mobile.length);
    if (mobile.match(/^[0-9]+$/) == null && mobile.length != 0) {
      setMobileMessage("A mobile number should contain numbers only");
    } else if (mobile.length != 10 && mobile.length != 0) {
      setMobileMessage("A mobile number should be 10 digits");
    } else if (!mobile.startsWith("0") && mobile.length != 0) {
      setMobileMessage("A mobile number should start with 0");
    } else {
      setMobileMessage("");
    }
  }, [mobile]);

  //Street code
  //Should allow only letters
  const [streetCodeMessage, setStreetCodeMessage] = useState("");
  useEffect(() => {
    if (addressStreetCode.match(/^[A-Za-z]+$/) == null && addressStreetCode.length != 0) {
      setStreetCodeMessage("A street code should contain letters only");
    } else if (addressStreetCode.length > 4 && addressStreetCode.length != 0) {
      setStreetCodeMessage("A street code should be 4 characters or less");
    } else {
      setStreetCodeMessage("");
    }
  }, [addressStreetCode]);

  //Street number
  const [streetNumberMessage, setStreetNumberMessage] = useState("");
  useEffect(() => {
    if (addressStreetNumber.toString().match(/^[0-9]+$/) == null && addressStreetNumber.toString().length != 0) {
      setStreetNumberMessage("A street number should contain numbers only");
    } else if (addressStreetNumber.toString().length > 4 && addressStreetNumber.toString().length != 0) {
      setStreetNumberMessage("A street number should be 4 digits or less");
    } else {
      setStreetNumberMessage("");
    }
  }, [addressStreetNumber]);

  //Postal code
  const [postalCodeMessage, setPostalCodeMessage] = useState("");
  useEffect(() => {
    if (addressPostalCode.match(/^[0-9]+$/) == null && addressPostalCode.length != 0) {
      setPostalCodeMessage("A postal code should contain numbers only");
    } else if (addressPostalCode.length > 4 && addressPostalCode.length != 0) {
      setPostalCodeMessage("A postal code should be 4 digits or less");
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
    // if (mobile === "") mandatoryFields.push("Mobile");
    if (greaterAreaList.length === 0) mandatoryFields.push("Greater Area");
    // if (preferredOption === "Select one") mandatoryFields.push("Preferred Communication");
    if (statusOption === "Select one") mandatoryFields.push("Status");
    if (startingDate === null) mandatoryFields.push("Starting Date");
    if (preferredOption === "Email" && email === "") mandatoryFields.push("Email is preferred communication but is empty");
    if (preferredOption === "SMS" && mobile === "") mandatoryFields.push("SMS is preferred communication but is empty");
    if (roleList.length === 0) mandatoryFields.push("Role");

    if (mobileMessage !== "") errorFields.push({ field: "Mobile", message: mobileMessage });
    if (streetCodeMessage !== "") errorFields.push({ field: "Street Code", message: streetCodeMessage });
    if (streetNumberMessage !== "") errorFields.push({ field: "Street Number", message: streetNumberMessage });
    if (postalCodeMessage !== "") errorFields.push({ field: "Postal Code", message: postalCodeMessage });
    if (southAfricanIDMessage !== "") errorFields.push({ field: "South African ID", message: southAfricanIDMessage });
    if (southAfricanIDOption === "Yes" && southAfricanID === "")
      errorFields.push({ field: "South African ID", message: "South African ID is selected but no ID is provided" });

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
  const handleUploadModal = (volunteerID: number, name: string, image: string) => {
    setIsUploadModalOpen(true);
    console.log("UserID: " + volunteerID + " Name: " + name + " Image: " + image + "IsUploadModalOpen: " + isUploadModalOpen);
    //setIsCreate(true);
    setUploadUserID(String(volunteerID));
    // setUploadModalID(userID);
    setUploadUserName(name);
    setUploadUserImage(image);
    //setIsUploadModalOpen(true);
  };

  //refetch the image so that it updates
  useEffect(() => {
    if (isUploadModalOpen) {
      // void user.refetch();
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

  // //-------------------------------INFINITE SCROLLING WITH INTERSECTION OBSERVER-----------------------------------------
  // const observerTarget = useRef<HTMLDivElement | null>(null);

  // const [limit] = useState(12);
  // const {
  //   data: queryData,
  //   fetchNextPage,
  //   hasNextPage,
  //   refetch,
  // } = api.volunteer.searchVolunteersInfinite.useInfiniteQuery(
  //   {
  //     volunteerID: id,
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
  // const clinics_data = queryData?.pages.flatMap((page) => page.clinics_data);
  // const volunteer_data_with_clinics = user_data?.map((volunteer) => {
  //   // Assuming each clinic object has a 'petID' that links it to a pet
  //   const associatedClinics = clinics_data?.filter((clinic) => clinic.volunteerID === volunteer.volunteerID);

  //   return {
  //     ...volunteer,
  //     clinics: associatedClinics,
  //   };
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
  // }, [isUpdate, isDeleted, isCreate, query, order, isViewProfilePage]);

  //-------------------------------------DATEPICKER--------------------------------------
  // Define the props for your custom input component
  interface CustomInputProps {
    value?: string;
    onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  }

  // CustomInput component with explicit types for the props
  const CustomInput: React.FC<CustomInputProps> = ({ value, onClick }) => (
    <button className="form-input flex items-center rounded-md border px-4 py-2" onClick={onClick}>
      <svg className="z-10 mr-2 h-4 w-4 text-gray-500 " aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
        <path d="M20 4a2 2 0 0 0-2-2h-2V1a1 1 0 0 0-2 0v1h-3V1a1 1 0 0 0-2 0v1H6V1a1 1 0 0 0-2 0v1H2a2 2 0 0 0-2 2v2h20V4ZM0 18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8H0v10Zm5-8h10a1 1 0 0 1 0 2H5a1 1 0 0 1 0-2Z" />
      </svg>
      <div className="m-1 mr-2">(Select here): </div>
      {isUpdate ? startingDate?.getDate().toString() + "/" + (startingDate.getMonth() + 1).toString() + "/" + startingDate.getFullYear().toString() : value}
    </button>
  );

  // //------------------------------------ADD AN EXISTING CLINIC FOR VOLUNTEER--------------------------------------
  // //Search for a clinic date and clinic ID given today's date. Todays date needs to match up with the clinic date for the clinic to be added to the volunteer
  // const handleAddClinic = async (id: number) => {
  //   //get today's date
  //   const today = new Date();
  //   //add to the clinic list and ID list and then add it to the table
  //   //check if the clinic date is today's date
  //   const option = clinicsAttendedOptions.find(
  //     (clinic) => clinic.date.getDate() === today.getDate() && clinic.date.getMonth() === today.getMonth() && clinic.date.getFullYear() === today.getFullYear(),
  //   );
  //   console.log("Option for clinic exists: ", option);
  //   const optionDate = option?.date.getDate().toString() + "/" + option?.date.getMonth().toString() + "/" + option?.date.getFullYear().toString();
  //   const optionID = option?.clinicID ?? 0;

  //   if (!clinicIDList.includes(optionID) && optionID != 0) {
  //     setClinicList([...clinicList, String(optionDate)]);
  //     setClinicIDList([...clinicIDList, optionID]);

  //     //update the pet table to add the clinic to the pet
  //     await addClinic.mutateAsync({
  //       volunteerID: id,
  //       clinicID: optionID,
  //     });
  //   }
  // };

  //------------------------------------ADD AN EXISTING CLINIC FOR VOLUNTEER--------------------------------------
  const [todayClinicList, setTodayClinicList] = useState<Clinic[]>([]);

  //show the clinic list for today
  const [showTodayClinics, setShowTodayClinics] = useState(false);
  const clinicRef = useRef<HTMLDivElement>(null);
  const [volunteerIDForClinic, setVolunteerIDForClinic] = useState(0);
  const [isClinicLoading, setIsClinicLoading] = useState(false);
  // const btnClinicRef = useRef<HTMLButtonElement>(null);

  //Key value pair of the petID that is the key and a clinicList that is value
  const [volunteerClinicList, setVolunteerClinicList] = useState<Record<number, Clinic[]>>({});

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

  //VolunteerID for clinic to be added
  //const [clinicVolunteerID, setClinicVolunteerID] = useState(0);
  //Search for a clinic date and clinic ID given today's date. Todays date needs to match up with the clinic date for the clinic to be added to the pet
  const handleAddClinic = async (id: number) => {
    const user = volunteer_data_with_clinics?.find((volunteer) => volunteer.volunteerID === id);

    const clinicData = user?.clinics;
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

    console.log("Clinic list from DB: ", clinicDates);
    console.log("Clinic list from frontend: ", clinicList);
    //if (clinicList.length > clinicDates.length && id === volunteerIDForClinic) return;
    if (volunteerClinicList[id] && (volunteerClinicList[id]?.length ?? 0) > clinicDates.length) return;

    // setClinicVolunteerID(id);
    setClinicList(clinicDates);

    setShowTodayClinics(true);

    setVolunteerIDForClinic(id);
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
  //     const clinics = volunteer_data_with_clinics?.find((volunteer) => volunteer.volunteerID === volunteerIDForClinic)?.clinics;
  //     const clinics_ =
  //       clinics?.map((clinic) => ({
  //         id: clinic.clinicID,
  //         date:
  //           clinic.clinic.date.getDate().toString() + "/" + (clinic.clinic.date.getMonth() + 1).toString() + "/" + clinic.clinic.date.getFullYear().toString(),
  //         area: clinic.clinic.greaterArea.greaterArea,
  //       })) ?? [];
  //     console.log("UseEffect - Clinic list from DB: ", clinics_);
  //     console.log("UseEffect - Clinic list from frontend: ", clinicList);
  //     //if (clinicList.length === clinics_.length+1 && volunteerIDForClinic === ) return;
  //     setClinicList(clinics_);
  //   }
  // }, [todayClinicList]);

  const handleAddTodaysClinic = async (volunteerID: number, clinicID: number) => {
    if (addClinic.isLoading) return;
    setIsClinicLoading(true);

    const clinicIDList = clinicList.map((clinic) => (clinic.id ? clinic.id : 0));
    console.log("Clinic ID List: ", clinicIDList);
    console.log("Clinic ID: ", clinicID);

    const volunteerClinicIDList = volunteerClinicList[volunteerID]?.map((clinic) => clinic.id) ?? [];

    // const clinics = volunteer_data_with_clinics?.find((volunteer) => volunteer.volunteerID === volunteerID)?.clinics;
    // const clinics_ =
    //   clinics?.map((clinic) => ({
    //     id: clinic.clinicID,
    //     date:
    //       clinic.clinic.date.getDate().toString() + "/" + (clinic.clinic.date.getMonth() + 1).toString() + "/" + clinic.clinic.date.getFullYear().toString(),
    //     area: clinic.clinic.greaterArea.greaterArea,
    //   })) ?? [];

    if (!clinicIDList.includes(clinicID) && !volunteerClinicIDList.includes(clinicID)) {
      // if (!clinics_.map((clinic) => clinic.id).includes(clinicID)) {
      setClinicList([...clinicList, todayClinicList.find((clinic) => clinic.id === clinicID) ?? { id: 0, date: "", area: "" }]);
      //setClinicList([...clinicList, todayClinicList.find((clinic) => clinic.id === clinicID)?.date ?? ""]);
      //setClinicIDList([...clinicIDList, clinicID]);
      //update the pet table to add the clinic to the pet
      await addClinic.mutateAsync({
        volunteerID: volunteerID,
        clinicID: clinicID,
      });

      setVolunteerClinicList({
        ...volunteerClinicList,
        [volunteerID]: [...(volunteerClinicList[volunteerID] ?? []), todayClinicList.find((clinic) => clinic.id === clinicID) ?? { id: 0, date: "", area: "" }],
      });
    }
    setShowTodayClinics(false);
    setTodayClinicList([]);
    // setVolunteerIDForClinic(0);
    setIsClinicLoading(false);
  };

  //retrieves the data from the table again when the clinicsAttended is updated
  useEffect(() => {
    void refetch();
  }, [isClinicLoading, clinicList, todayClinicList]);

  // ----------------------------------------Uploading Image----------------------------------------
  useEffect(() => {
    if (user?.image != "" && isDoneUploading) {
      setIsDoneUploading(false);
    }
  }, [user, isCreate, isUpdate, isViewProfilePage]);

  //------------------------------------------DOWNLOADING USER TABLE TO EXCEL FILE------------------------------------------
  const downloadUserTable = api.volunteer.download.useQuery({ searchQuery: query });
  const handleDownloadVolunteerTable = async () => {
    setIsLoading(true);
    //take the download user table query data and put it in an excel file
    const data = downloadUserTable.data;
    const fileName = "Volunteer Table";
    const fileType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
    const fileExtension = ".xlsx";
    const ws = XLSX.utils.json_to_sheet(data ?? []);
    const wb = { Sheets: { data: ws }, SheetNames: ["data"] };
    const excelBuffer: Uint8Array = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as Uint8Array;
    const dataFile = new Blob([excelBuffer], { type: fileType });
    FileSaver.saveAs(dataFile, fileName + fileExtension);
    setIsLoading(false);
  };
  const [checked, setChecked] = useState(false);
  // const handleChecked = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   if (e.target.checked) {
  //     setChecked("checked");
  //   } else {
  //     setChecked("unchecked");
  //   }
  // };

  return (
    <>
      <Head>
        <title>Volunteer Profiles</title>
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
                    onClick={handleDownloadVolunteerTable}
                  >
                    {isLoading ? (
                      <div
                        className="mx-2 inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-current border-white border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
                        role="status"
                      />
                    ) : (
                      <div>Download Volunteer Table</div>
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
                    Create New Volunteer
                  </button>
                  {/* <div className="border-2 bg-gray-300 p-3 text-blue-500">
                    Upload
                    <input type="file" onChange={(e) => void handleUpload(e)} accept=".xlsx, .xls" />
                  </div> */}
                  {/* <button className="absolute left-10 top-0 mx-3 mb-3 rounded-lg bg-main-orange p-3 hover:bg-orange-500" onClick={handleDeleteAllUsers}>
                    Delete all users
                  </button> */}
                </div>
              </div>

              {volunteer_data_with_clinics ? (
                <article className="my-5 flex w-full justify-center rounded-md shadow-inner">
                  <div className="max-h-[70vh] max-w-7xl overflow-auto">
                    {/* max-h-[60vh] */}
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="z-30 bg-gray-50">
                        <tr>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2"></th>
                          {/* <th className="px-4 py-2">ID</th> */}
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Name</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">
                            <span className="group relative inline-block">
                              <button className={`${order === "surname" ? "underline" : ""}`} onClick={() => handleOrderFields("surname")}>
                                Surname
                              </button>
                              <span className="absolute right-[-30px] top-full hidden w-[130px] whitespace-nowrap rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 shadow-sm group-hover:block">
                                Sort alphabetically
                              </span>
                            </span>
                          </th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Email</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Mobile</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Greater Area</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Status</th>
                          <th className="sticky top-0 z-10 w-[35px] bg-gray-50 px-4 py-2">Last Clinic</th>
                          {/* <th className="w-[35px] px-4 py-2">
                        <button className={`${order == "updatedAt" ? "underline" : ""}`} onClick={() => handleOrderFields("updatedAt")}>
                          Last Update
                        </button>
                      </th> */}
                          <th className="sticky top-0 z-10 w-[35px] bg-gray-50 px-4 py-2">
                            <span className="group relative inline-block">
                              <button className={`${order === "updatedAt" ? "underline" : ""}`} onClick={() => handleOrderFields("updatedAt")}>
                                Last Update
                              </button>
                              <span className="absolute right-[-20px] top-full hidden w-[110px] rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 shadow-sm group-hover:block">
                                Sort reverse chronologically
                              </span>
                            </span>
                          </th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {volunteer_data_with_clinics?.map((user, index) => {
                          return (
                            <tr className="items-center">
                              <td className=" border px-2 py-1">
                                <div className="flex justify-center">{index + 1}</div>
                              </td>
                              {/* <td className="border px-4 py-2">V{user.volunteerID}</td> */}
                              <td className="border px-2 py-1">{user.firstName}</td>
                              <td className="border px-2 py-1">{user.surname}</td>
                              <td className="border px-2 py-1">{user.email}</td>
                              <td className="border px-2 py-1">{user.mobile}</td>
                              <td className="border px-2 py-1">
                                {user?.greaterAreas
                                  ?.sort((a, b) => a.greaterAreaID - b.greaterAreaID)
                                  .map((greaterArea) => greaterArea.greaterArea.greaterArea)
                                  .join(", ") ?? ""}
                              </td>
                              <td className="border px-2 py-1">{user.status}</td>
                              <td className="border px-2 py-1">
                                {user.clinics && user.clinics.length > 0 ? (
                                  <>
                                    {user?.clinics?.[user?.clinics.length - 1]?.clinic?.date.getDate().toString()}/
                                    {((user?.clinics?.[user?.clinics.length - 1]?.clinic?.date.getMonth() ?? 0) + 1).toString()}/
                                    {user?.clinics?.[user?.clinics.length - 1]?.clinic?.date.getFullYear().toString()}
                                  </>
                                ) : (
                                  "None"
                                )}
                              </td>
                              <td className="border px-2 py-1">
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
                                      onClick={() => handleDeleteModal(user.volunteerID, String(user.volunteerID), user.firstName ?? "")}
                                    />
                                    <span className="absolute bottom-full z-50 hidden rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 shadow-sm group-hover:block">
                                      Delete volunteer
                                    </span>
                                  </span>
                                </div>

                                <div className="relative flex items-center justify-center">
                                  <span className="group relative mx-[5px] my-3 flex items-center justify-center rounded-lg hover:bg-orange-200">
                                    <Pencil size={24} className="block" onClick={() => handleUpdateUserProfile(user.volunteerID)} />
                                    <span className="absolute bottom-full z-50 hidden rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 shadow-sm group-hover:block">
                                      Update volunteer
                                    </span>
                                  </span>
                                </div>

                                <div className="relative flex items-center justify-center">
                                  <span className="group relative mx-[5px] my-3 flex items-center justify-center rounded-lg hover:bg-orange-200">
                                    <AddressBook size={24} className="block" onClick={() => handleViewProfilePage(user.volunteerID)} />
                                    <span className="absolute bottom-full z-50 hidden w-[105px] rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 shadow-sm group-hover:block">
                                      View volunteer profile
                                    </span>
                                  </span>
                                </div>
                                {/* <div className="relative flex items-center justify-center">
                                <button
                                  onClick={() => handleRandomDate(user.volunteerID)}
                                  className="rounded-lg bg-main-orange p-3 text-white hover:bg-orange-500"
                                >
                                  <span className="absolute bottom-full hidden w-[90px] rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 shadow-sm group-hover:block">
                                    Random date
                                  </span>
                                </button>
                              </div> */}

                                <div className="relative flex items-center justify-center">
                                  <span className="group relative mx-[5px] my-3 mr-[32px] flex items-center justify-center rounded-lg hover:bg-orange-200">
                                    <Bed size={24} className="block" onClick={() => handleAddClinic(user.volunteerID)} />
                                    <span className="absolute bottom-full z-50 hidden w-[88px] rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 shadow-sm group-hover:block">
                                      Add today's clinic to volunteer
                                    </span>

                                    {showTodayClinics && volunteerIDForClinic === user.volunteerID && (
                                      <>
                                        {isClinicLoading ? (
                                          <div
                                            className="mx-2 inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-current border-main-orange border-r-transparent align-[-0.125em] group-hover:block motion-reduce:animate-[spin_1.5s_linear_infinite]"
                                            role="status"
                                          />
                                        ) : (
                                          <div
                                            ref={clinicRef}
                                            className="absolute right-0 top-0 z-10 w-44 divide-y divide-gray-100 rounded-lg bg-white shadow group-hover:block"
                                          >
                                            <ul className="rounded-lg border-2 border-black py-2 text-sm text-gray-700 " aria-labelledby="dropdownHoverButton">
                                              {todayClinicList.length > 0 ? (
                                                todayClinicList.map((option) => (
                                                  <li key={option.id} onClick={() => handleAddTodaysClinic(user.volunteerID, option.id)}>
                                                    <button className="block px-4 py-2 hover:bg-gray-100">
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
            <div className="3xl:top-[8.5%] sticky top-[11%] z-50 flex justify-center">
              <div className="relative mb-4 flex grow flex-col items-center rounded-lg bg-slate-300 px-5 py-6">
                <b className=" text-2xl">{isUpdate ? "Update Volunteer Data" : "Create New Volunteer"}</b>
                <div className="flex justify-center">
                  <button className="absolute right-0 top-0 m-3 rounded-lg bg-main-orange p-3 text-white hover:bg-orange-500" onClick={handleBackButton}>
                    Back To Volunteer Table
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
              <label className="">
                {"("}All fields marked <span className="mb-2 items-start px-1 text-lg text-main-orange"> * </span> are compulsary{")"}
              </label>
              <div className="flex flex-col items-start">
                {/* <div className="p-2">Volunteer ID: {(latestVolunteerID?.data?.volunteerID ?? 0) + 1}</div> */}
                {/*<div className="p-2">User ID: {(lastUserCreated?.data?.userID ?? 1000000) + 1}</div>*/}
                <div className="relative my-2 flex w-full flex-col rounded-lg border-2 bg-slate-200 p-4">
                  <b className="mb-3 text-center text-xl">Personal & Contact Data</b>
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
                      input={{ userId: String(user?.volunteerID) ?? "", user: "volunteer" }}
                      onUploadError={(error: Error) => {
                        // Do something with the error.
                        alert(`ERROR! ${error.message}`);
                      }}
                      onClientUploadComplete={() => {
                        setIsDoneUploading(true);
                        //void user.refetch();
                      }}
                    />
                  )}
                  <div className="flex py-2">
                    Volunteer ID: <div className="px-3">V{isCreate ? String((latestVolunteerID?.data?.volunteerID ?? 0) + 1) : id}</div>
                  </div>
                  <Input label="First Name" placeholder="Type here: e.g. John" value={firstName} onChange={setFirstName} required />
                  <Input label="Surname" placeholder="Type here: e.g. Doe" value={surname} onChange={setSurname} required />
                  {/* South African ID with dropdown and textbox */}
                  <div className="flex items-start">
                    <div className="mr-3 flex items-center pt-4">
                      <label className="">South African ID: </label>
                    </div>
                    <div className="flex flex-col">
                      <button
                        ref={btnSouthAfricanIDRef}
                        className="mb-3 mt-2 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300"
                        type="button"
                        onClick={handleToggleSouthAfricanID}
                      >
                        {southAfricanIDOption + " "}
                        <svg className="ms-3 h-2.5 w-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                        </svg>
                      </button>
                      {isSouthAfricanIDOpen && (
                        <div ref={southAfricanIDRef} className="z-10 w-44 divide-y divide-gray-100 rounded-lg bg-white shadow">
                          <ul className="py-2 text-sm text-gray-700" aria-labelledby="dropdownHoverButton">
                            {southAfricanIDOptions.map((option) => (
                              <li key={option} onClick={() => handleSouthAfricanIDOption(option)}>
                                <button className="block px-4 py-2 hover:bg-gray-100">{option}</button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    {southAfricanIDOption === "Yes" && (
                      <div className="flex flex-col items-center">
                        <input
                          className="m-2 mt-4 rounded-lg border-2 border-slate-300 px-2 focus:border-black"
                          placeholder="Type here: e.g. 9303085835382"
                          onChange={(e) => setSouthAfricanID(e.target.value)}
                          value={southAfricanID}
                        />
                        {southAfricanIDMessage && <div className="text-sm text-red-500">{southAfricanIDMessage}</div>}
                      </div>
                    )}
                  </div>
                  <Input label="Email" placeholder="Type here: e.g. jd@gmail.com" value={email} onChange={setEmail} />
                  <Input label="Mobile" placeholder="Type here: e.g. 0821234567" value={mobile} onChange={setMobile} />
                  {mobileMessage && <div className="text-sm text-red-500">{mobileMessage}</div>}

                  {(mobile != "" || email != "") && (
                    <div className="flex items-start">
                      <div className="mr-3 flex items-start pt-4">
                        <label className="mb-2">Preferred Communication Channel: </label>
                      </div>
                      <div className="flex flex-col">
                        <button
                          ref={btnPreferredCommunicationRef}
                          className="my-3 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300"
                          type="button"
                          onClick={handleTogglePreferredCommunication}
                        >
                          {preferredOption + " "}
                          <svg className="ms-3 h-2.5 w-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                          </svg>
                        </button>
                        {preferredCommunication && (
                          <div ref={preferredCommunicationRef} className="z-10 w-44 divide-y divide-gray-100 rounded-lg bg-white shadow">
                            <ul className="py-2 text-sm text-gray-700 " aria-labelledby="dropdownHoverButton">
                              {preferredCommunicationOptions.map((option) => (
                                <li key={option} onClick={() => handlePreferredCommunicationOption(option)}>
                                  <button className="block px-4 py-2 hover:bg-gray-100 ">{option}</button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="my-2 flex w-full flex-col rounded-lg border-2 bg-slate-200 p-4">
                  <b className="mb-3 text-center text-xl">Geographical & Location Data</b>
                  <div className="flex flex-col divide-y-2 divide-gray-300">
                    <div className="flex items-start">
                      <div className="mr-3 flex items-center pt-4">
                        <label className="">
                          Greater Area(s)<span className="text-lg text-main-orange">*</span>:{" "}
                        </label>
                      </div>

                      {/* Old code. before checkboxes */}
                      {/* <div className="flex flex-col items-center">
                        <button
                          onClick={handleShowGreaterArea}
                          className="mb-2 mr-3 mt-3 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                        >
                          Show all greater areas attended
                        </button>
                        {showGreaterArea && (
                          <ul className="mr-3 w-full rounded-lg bg-white px-5 py-2 text-sm text-gray-700 dark:text-gray-200">
                            {greaterAreaList.map((greaterArea) => (
                              <li key={greaterArea.id} className=" py-2">
                                {greaterArea.area}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div> */}

                      <div className="flex flex-col">
                        <button
                          ref={btnGreaterAreaRef}
                          className="my-3 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300"
                          type="button"
                          onClick={handleToggleGreaterArea}
                        >
                          {isUpdate ? greaterAreaOption : greaterAreaOption + " "}
                          <svg className="ms-3 h-2.5 w-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                          </svg>
                        </button>
                        {isGreaterAreaOpen && (
                          <div ref={greaterAreaRef} className="z-10 w-44 divide-y divide-gray-100 rounded-lg bg-white shadow ">
                            <ul className="py-2 text-sm text-gray-700 " aria-labelledby="dropdownHoverButton">
                              <li key={1}>
                                <div className="flex items-center px-4">
                                  <input
                                    id="1"
                                    type="checkbox"
                                    checked={greaterAreaSelection?.allSelected}
                                    onChange={(e) => handleGreaterArea(0, "", e.target.checked, "allSelected")}
                                    className="h-4 w-4 rounded bg-gray-100 text-main-orange accent-main-orange focus:ring-2"
                                  />
                                  <label htmlFor="1" className=" ms-2 text-sm font-bold text-gray-900">
                                    Select All
                                  </label>
                                </div>
                              </li>
                              <li key={2}>
                                <div className="flex items-center px-4">
                                  <input
                                    id="2"
                                    type="checkbox"
                                    checked={greaterAreaSelection?.clear}
                                    onChange={(e) => handleGreaterArea(0, "", e.target.checked, "clear")}
                                    className="h-4 w-4 rounded bg-gray-100 text-main-orange accent-main-orange focus:ring-2"
                                  />
                                  <label htmlFor="2" className="ms-2 text-sm font-bold text-gray-900">
                                    Clear All
                                  </label>
                                </div>
                              </li>
                              {greaterAreaListOptions
                                ?.sort((a, b) => a.area.localeCompare(b.area))
                                .map((option) => (
                                  <li key={option.id}>
                                    <div className="flex items-center px-4">
                                      <input
                                        id={String(option.id)}
                                        type="checkbox"
                                        checked={option.state}
                                        onChange={(e) => handleGreaterArea(option.id, option.area, e.target.checked, "normal")}
                                        className="h-4 w-4 rounded bg-gray-100 text-main-orange accent-main-orange focus:ring-2"
                                      />
                                      <label htmlFor={String(option.id)} className="ms-2 text-sm font-medium text-gray-900">
                                        {option.area}
                                      </label>
                                    </div>
                                  </li>
                                ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start divide-x-2 divide-gray-300">
                      <div className="flex flex-col pr-2">
                        <Input label="Street" placeholder="Type here: e.g. Marina Str" value={street} onChange={setStreet} />

                        <Input label="Street Code" placeholder="Type here: e.g. OH" value={addressStreetCode} onChange={setAddressStreetCode} />
                        {streetCodeMessage && <div className="text-sm text-red-500">{streetCodeMessage}</div>}

                        <div className="flex items-center">
                          <div className="">Street Number: </div>
                          <input
                            className="m-2 rounded-lg border-2 border-slate-300 px-2 focus:border-black"
                            placeholder="Type here: e.g. 14"
                            onChange={(e) => handleAddressStreetNumber(e.target.value)}
                            value={addressStreetNumber === 0 ? "" : addressStreetNumber.toString()}
                          />
                        </div>
                        {streetNumberMessage && <div className="text-sm text-red-500">{streetNumberMessage}</div>}

                        <div className="flex items-center">
                          <div>Suburb: </div>
                          <input
                            className="m-2 rounded-lg border-2 border-slate-300 px-2 focus:border-black"
                            placeholder="Type here: e.g. Lakeside"
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
                      </div>
                      {/*Free form address */}
                      <div className="mt-3 flex flex-col pl-4">
                        <div>Or, Alternatively, Free-form Address</div>
                        <textarea
                          className=" h-64 w-72 rounded-lg border-2 border-slate-300 px-2 focus:border-black"
                          placeholder="Type here: e.g. 1234 Plaza, 1234.
                          
                          
                          Also to be used if the correct street name is not in the drop-down list"
                          onChange={(e) => setAddressFreeForm(e.target.value)}
                          value={addressFreeForm}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="my-2 flex w-full flex-col rounded-lg border-2 bg-slate-200 p-4">
                  <b className="mb-3 text-center text-xl">AfriPaw Association Data</b>

                  <div className="flex items-start">
                    <div className="mr-3 flex items-center pt-4">
                      <label className="">
                        Role(s)<span className="text-lg text-main-orange">*</span>:{" "}
                      </label>
                    </div>

                    {/* <div className="flex flex-col items-center">
                      <button
                        onClick={handleShowRole}
                        className="mb-2 mr-3 mt-3 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                      >
                        Show all roles
                      </button>
                      {showRole && (
                        <ul className="mr-3 w-full rounded-lg bg-white px-5 py-2 text-sm text-gray-700 dark:text-gray-200">
                          {roleList.map((role) => (
                            <li key={role} className=" py-2">
                              {role}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div> */}

                    <div className="flex flex-col">
                      <button
                        ref={btnRoleRef}
                        className="my-3 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300"
                        type="button"
                        onClick={handleToggleRole}
                      >
                        {isUpdate ? roleOption : roleOption + " "}
                        <svg className="ms-3 h-2.5 w-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                        </svg>
                      </button>
                      {isRoleOpen && (
                        <div ref={roleRef} className="z-10 w-52 divide-y divide-gray-100 rounded-lg bg-white shadow ">
                          {/* <ul className="py-2 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdownHoverButton">
                            {roleOptions.map((option) => (
                              <li key={option} onClick={() => handleRoleOption(option)}>
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
                                  checked={roleSelection?.allSelected}
                                  onChange={(e) => handleRole("", e.target.checked, "allSelected")}
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
                                  checked={roleSelection?.clear}
                                  onChange={(e) => handleRole("", e.target.checked, "clear")}
                                  className="h-4 w-4 rounded bg-gray-100 text-main-orange accent-main-orange focus:ring-2"
                                />
                                <label htmlFor="2" className="ms-2 text-sm font-bold text-gray-900">
                                  Clear All
                                </label>
                              </div>
                            </li>
                            {roleListOptions?.map((option) => (
                              <li key={option.role}>
                                <div className="flex items-center px-4">
                                  <input
                                    id={String(option.role)}
                                    type="checkbox"
                                    checked={option.state}
                                    onChange={(e) => handleRole(option.role, e.target.checked, "normal")}
                                    className="h-4 w-4 rounded bg-gray-100 text-main-orange accent-main-orange focus:ring-2"
                                  />
                                  <label htmlFor={String(option.role)} className="ms-2 text-sm font-medium text-gray-900">
                                    {option.role}
                                  </label>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                  <Input label="Collaborator Organisation" placeholder="Type here: e.g. Tears" value={collaboratorOrg} onChange={setCollaboratorOrg} />

                  <div className="flex items-start">
                    <div className="mr-3 flex items-center pt-4">
                      <label className="">
                        Status<span className="text-lg text-main-orange">*</span>:{" "}
                      </label>
                    </div>
                    <div className="flex flex-col">
                      <button
                        ref={btnStatusRef}
                        className="my-3 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300 "
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
                        <div ref={clinicsAttendedRef} className="z-10 w-52 divide-y divide-gray-100 rounded-lg bg-white shadow ">
                          <ul className="py-2 text-sm text-gray-700 " aria-labelledby="dropdownHoverButton">
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

                          {/* <ul className="py-2 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdownHoverButton">
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
                                <button className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">
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

                  {/*DATEPICKER*/}
                  <div className="flex items-center">
                    <label className="">
                      Starting Date<span className="text-lg text-main-orange">*</span>:{" "}
                    </label>
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
                    <div className="w-36 pt-3">Comments: </div>
                    <textarea
                      className="m-2 h-24 w-full rounded-lg border-2 border-slate-300 px-2 focus:border-black"
                      placeholder="Type here: e.g. Notes on commitment, engagement, etc."
                      onChange={(e) => setComments(e.target.value)}
                      value={comments}
                    />
                  </div>

                  {(email != "" || mobile != "") && (
                    <div className="flex items-center">
                      <input
                        id="checked-checkbox"
                        type="checkbox"
                        onChange={(e) => setSendVolunteerDetails(e.target.checked)}
                        className="h-4 w-4 rounded bg-gray-100 text-main-orange accent-main-orange focus:ring-2"
                      />
                      <label htmlFor="checked-checkbox" className="ms-2 text-sm font-medium text-gray-900">
                        Welcome volunteer via preferred communication channel
                      </label>
                    </div>
                  )}
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
            <div className="3xl:top-[8.5%] sticky top-[11%] z-50 flex justify-center">
              <div className="relative mb-4 flex grow flex-col items-center rounded-lg bg-slate-300 px-5 py-6">
                <div className=" text-2xl">Volunteer Profile</div>
                <div className="flex justify-center">
                  <button className="absolute right-0 top-0 m-3 rounded-lg bg-main-orange p-3 text-white hover:bg-orange-500" onClick={handleBackButton}>
                    Back To Volunteer Table
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
                  <b className="mb-14 text-center text-xl">Personal & Contact Data</b>
                  <div className="mb-2 flex items-center">
                    <b className="mr-3">Volunteer ID:</b> V{user?.volunteerID}
                  </div>

                  <div className="mb-2 flex items-center">
                    <b className="mr-3">Name:</b> {firstName}
                  </div>

                  <div className="mb-2 flex items-center">
                    <b className="mr-3">Surname:</b> {surname}
                  </div>

                  <div className="mb-2 flex items-center">
                    <b className="mr-3">South African ID:</b> {southAfricanID}
                  </div>

                  <div className="mb-2 flex items-center">
                    <b className="mr-3">Email:</b> {email}
                  </div>

                  <div className="mb-2 flex items-center">
                    <b className="mr-3">Mobile:</b> {mobile}
                  </div>

                  <div className="mb-2 flex items-center">
                    <b className="mr-3">Preferred Communication Channel:</b> {preferredOption}
                  </div>
                </div>

                <div className="my-2 flex w-full flex-col rounded-lg border-2 bg-slate-200 p-4">
                  <b className="mb-3 text-center text-xl">Geographical & Location Data</b>
                  <div className="mb-2 flex items-center">
                    <b className="mr-3">Greater Area(s):</b>{" "}
                    {greaterAreaList
                      .sort((a, b) => a.id - b.id)
                      .map((greaterArea) => greaterArea.area)
                      .join(", ")}
                  </div>
                  <div className="flex items-start divide-x-2 divide-gray-300">
                    <div className="flex w-96 flex-col pr-2">
                      <div className="mb-2 flex items-center">
                        <b className="mr-3">Street:</b> {street}
                      </div>

                      <div className="mb-2 flex items-center">
                        <b className="mr-3">Street Code:</b> {addressStreetCode}
                      </div>

                      <div className="mb-2 flex items-center">
                        <b className="mr-3">Street Number:</b> {addressStreetNumber === 0 ? "" : addressStreetNumber}
                      </div>

                      <div className="mb-2 flex items-center">
                        <b className="mr-3">Suburb:</b> {addressSuburb}
                      </div>

                      <div className="mb-2 flex items-center">
                        <b className="mr-3">Postal Code:</b> {addressPostalCode}
                      </div>
                    </div>

                    {/*Free form address */}
                    <div className=" flex w-96 flex-col pl-4">
                      <b>Or, Free-form Address:</b>
                      <div className=" mt-3 focus:border-black" style={{ whiteSpace: "pre-wrap" }}>
                        {addressFreeForm}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="my-2 flex w-full flex-col rounded-lg border-2 bg-slate-200 p-4">
                  <b className="mb-3 text-center text-xl">AfriPaw Association Data</b>

                  <div className="mb-2 flex items-center">
                    <b className="mr-3">Role(s):</b>{" "}
                    {roleList
                      .sort((a, b) => a.localeCompare(b))
                      .map((role) => role)
                      .join(", ")}
                  </div>

                  <div className="mb-2 flex items-center">
                    <b className="mr-3">Collaborator Organisation:</b> {collaboratorOrg}
                  </div>

                  <div className="mb-2 flex items-center">
                    <b className="mr-3">Status:</b> {statusOption}
                  </div>

                  {/* <div className="mb-2 flex items-center">
                    <b className="mr-3">Clinics Attended:</b> {clinicList.length} in Total{" "}
                    {clinicList.length > 0 && (
                      <>
                        (
                        {clinicList.map((clinic, index) =>
                          clinicList.length - 1 === index ? clinic.date + " " + clinic.area : clinic.date + " " + clinic.area + "; ",
                        )}
                        )
                      </>
                    )}
                  </div> */}
                  <div className="mb-2 flex items-start gap-2">
                    <b className="mr-1">Clinic(s) Attended:</b> <div className="min-w-[4rem]">{clinicList.length} in Total</div>
                    {clinicList.length > 0 && (
                      <div className="flex flex-col">
                        {clinicList
                          // .sort((a, b) => a.id - b.id)
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
                    <b className="mr-3">Starting Date:</b>{" "}
                    {startingDate?.getDate() + "/" + ((startingDate?.getMonth() ?? 0) + 1) + "/" + startingDate?.getFullYear()}
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
      </main>
    </>
  );
};

export default Volunteer;
