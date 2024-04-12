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
//import { areaOptions } from "~/components/GeoLocation/areaOptions";

//Icons
import { AddressBook, Pencil, Dog, Printer, Trash, UserCircle, Users } from "phosphor-react";

//Date picker
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

//Communication
import { sendSMS } from "~/pages/api/smsPortal";

//Excel
import * as XLSX from "xlsx";

//File saver
//import FileSaver from "file-saver";
import * as FileSaver from "file-saver";

import { UploadButton } from "~/utils/uploadthing";
import { useSession } from "next-auth/react";
import Input from "~/components/Base/Input";
import { bg } from "date-fns/locale";
import { set } from "date-fns";
import { router } from "@trpc/server";

const Communication: NextPage = () => {
  useSession({ required: true });

  //Types
  type Communication = {
    communicationID: number;
    message: string;
    type: string;
    recipients: string[];
    greaterArea: string[];
    area: string[];
    success: string;
    updatedAt: string;
  };

  //-------------------------------GREATER AREA-----------------------------------------
  type GreaterArea = {
    id: number;
    name: string;
  };

  type GreaterAreaOptions = {
    id: number;
    name: string;
    state: boolean;
  };

  type GreaterAreaSelect = {
    allSelected: boolean;
    clear: boolean;
  };

  type Area = {
    id: number;
    name: string;
  };

  type AreaOptions = {
    id: number;
    name: string;
    state: boolean;
  };

  type AreaSelect = {
    allSelected: boolean;
    clear: boolean;
  };

  const newCommunication = api.communication.create.useMutation();
  //const updateClinic = api.petClinic.update.useMutation();
  //const [isUpdate, setIsUpdate] = useState(false);
  const [isCreate, setIsCreate] = useState(false);
  //Update the table when user is deleted
  const [isDeleted, setIsDeleted] = useState(false);

  //For moving between different pages
  const router = useRouter();

  //-------------------------------LOADING ANIMATIONS-----------------------------------------
  const [isLoading, setIsLoading] = useState(false);

  //-------------------------------UPDATE IDENTIFICATION-----------------------------------------
  const updateIdentification = api.communication.updateIdentification.useMutation();

  //get latest communicationID
  const latestCommunicationID = api.communication.getLatestCommunicationID.useQuery();

  //Recipients
  const [recipients, setRecipients] = useState<string[]>([]);

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
  const [greaterAreaOption, setGreaterAreaOption] = useState("Select here");
  const greaterAreaRef = useRef<HTMLDivElement>(null);
  const btnGreaterAreaRef = useRef<HTMLButtonElement>(null);

  const [isAreaOpen, setIsAreaOpen] = useState(false);
  const [areaOption, setAreaOption] = useState("Select here");
  const areaRef = useRef<HTMLDivElement>(null);
  const btnAreaRef = useRef<HTMLButtonElement>(null);

  const [preferredCommunication, setPreferredCommunication] = useState(false);
  const [preferredOption, setPreferredCommunicationOption] = useState("Select one");
  const preferredCommunicationRef = useRef<HTMLDivElement>(null);
  const btnPreferredCommunicationRef = useRef<HTMLButtonElement>(null);

  //GREATER AREA USERS
  //to select multiple areas
  // const [greaterAreaList, setGreaterAreaList] = useState<GreaterArea[]>([]);
  // const handleToggleGreaterArea = () => {
  //   setIsGreaterAreaOpen(!isGreaterAreaOpen);
  // };

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
        name: area.name,
      }));
      setGreaterAreaList(greaterAreas);
      //order the greaterAreaList from smallest to largest id
      //setGreaterAreaList(greaterAreaList.sort((a, b) => a.id - b.id));
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
          name: String(option),
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
        setGreaterAreaList(updatedGreaterAreaList);

        //order the greaterAreaList from smallest to largest id
        //setGreaterAreaList(greaterAreaList.sort((a, b) => a.id - b.id));
        setGreaterAreaListOptions(greaterAreaListOptions.map((area) => (area.id === id ? { ...area, state: false } : area)));
        // console.log("Greater Area list: ", greaterAreaList);
        // console.log("Greater Area List Options: ", greaterAreaListOptions);
      }
    }
  };

  const handleGreaterAreaOption = (option: SetStateAction<string>, id: number) => {
    setGreaterAreaOption(option);
    setIsGreaterAreaOpen(false);

    const greaterAreaIDList = greaterAreaList.map((area) => area.id);

    const greaterArea: GreaterArea = { id: id, name: String(option) };

    //console.log("Option chosen!!!!!: ", option);
    if (option === "All greater areas") {
      //console.log("Option chosen!!!!!: ", option);
      //select all the greater areas except the first one
      const greaterAreaOptionsSelected = greaterAreaOptions.slice(1);
      setGreaterAreaList(greaterAreaOptionsSelected);
      //console.log("Greater Area List for all greaters: ", greaterAreaList);
      // setGreaterAreaList(greaterAreaOptions.map((option) => option);
    } else if (!greaterAreaIDList.includes(greaterArea.id)) {
      setGreaterAreaList([...greaterAreaList, greaterArea]);
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

  //Greater Area
  const getAllGreaterAreas = api.geographic.getAllGreaterAreas.useQuery().data;
  const allGreaterAreas = getAllGreaterAreas?.map((area) => {
    return { id: area.greaterAreaID, name: area.greaterArea };
  });
  //add the first option as "All greater areas" with id 0
  //const greaterAreaOptions = [{ id: 0, name: "All greater areas" }, ...(allGreaterAreas ?? [])];
  const greaterAreaOptions = allGreaterAreas ?? [];

  //Area
  //const getAllAreas = api.geographic.getAllAreas.useQuery().data;
  const getAllAreas = greaterAreaList
    .map((area) => {
      if (getAllGreaterAreas === undefined) return [];
      //console.log("Greater Area ID: ", area.id);
      if (getAllGreaterAreas.find((greaterArea) => greaterArea.greaterAreaID === area.id)) {
        // console.log("Here is your Area: ", getAllGreaterAreas.find((greaterArea) => greaterArea.greaterAreaID === area.id)?.area);
        return getAllGreaterAreas.find((greaterArea) => greaterArea.greaterAreaID === area.id)?.area;
      }
    })
    .flat();

  //console.log("Here are all the areas: ", getAllAreas);
  const allAreas = getAllAreas?.map((area) => {
    //make the id and name in the allAreas not undefined
    if (area === undefined) return { id: 0, name: "" };
    return { id: area?.areaID, name: area?.area };
  });

  //console.log("Here are all the areas2: ", allAreas);
  //add the first option as "All areas" with id 0
  const areaOptions = allAreas ?? [];

  // //Street
  // const getAllStreets = api.geographic.getAllStreets.useQuery().data;
  // const allStreets = getAllStreets?.map((street) => {
  //   return { id: street.streetID, name: street.street };
  // });
  // //add the first option as "All streets" with id 0
  // const streetOptions = [{ id: 0, name: "All streets" }, ...allStreets ?? []];

  //show all the clinics that the volunteer attended
  const [showGreaterArea, setShowGreaterArea] = useState(false);
  const handleShowGreaterArea = () => {
    setShowGreaterArea(!showGreaterArea);
  };

  //AREA
  //to select multiple areas
  const [areaList, setAreaList] = useState<Area[]>([]);
  const handleToggleArea = () => {
    setIsAreaOpen(!isAreaOpen);
  };

  const [areaListOptions, setAreaListOptions] = useState<AreaOptions[]>([]);
  const [areaSelection, setAreaSelection] = useState<AreaSelect>();

  const handleArea = (id: number, option: SetStateAction<string>, state: boolean, selectionCategory: string) => {
    if (selectionCategory === "allSelected") {
      setAreaOption("Select All");
      setAreaSelection({ allSelected: state, clear: false });

      const areas = areaListOptions.map((area) => ({
        id: area.id,
        name: area.name,
      }));
      setAreaList(areas);
      //order the greaterAreaList from smallest to largest id
      //setGreaterAreaList(greaterAreaList.sort((a, b) => a.id - b.id));
      setAreaListOptions(areaListOptions.map((area) => ({ ...area, state: true })));
    } else if (selectionCategory === "clear") {
      setAreaOption("Clear All");
      setAreaSelection({ allSelected: false, clear: state });

      setAreaList([]);
      setAreaListOptions(areaListOptions.map((area) => ({ ...area, state: false })));
    } else if (selectionCategory === "normal") {
      setAreaOption(option);
      setAreaSelection({ allSelected: false, clear: false });
      if (state) {
        const area: Area = {
          id: id,
          name: String(option),
        };
        const areaIDList = areaList.map((area) => area.id);
        if (!areaIDList.includes(id)) {
          setAreaList([...areaList, area]);

          //order the greaterAreaList from smallest to largest id
          // console.log(
          //   "Sorted Greater Areas!!!: ",
          //   greaterAreaList.sort((a, b) => a.id - b.id),
          // );
          // setGreaterAreaList(greaterAreaList.sort((a, b) => a.id - b.id));
        }
        setAreaListOptions(areaListOptions.map((area) => (area.id === id ? { ...area, state: true } : area)));

        // console.log("Greater Area list: ", greaterAreaList);
        // console.log("Greater Area List Options: ", greaterAreaListOptions);
      } else {
        const updatedAreaList = areaList.filter((area) => area.id !== id);
        setAreaList(updatedAreaList);

        //order the greaterAreaList from smallest to largest id
        //setGreaterAreaList(greaterAreaList.sort((a, b) => a.id - b.id));
        setAreaListOptions(areaListOptions.map((area) => (area.id === id ? { ...area, state: false } : area)));
        // console.log("Greater Area list: ", greaterAreaList);
        // console.log("Greater Area List Options: ", greaterAreaListOptions);
      }
    }
  };

  useEffect(() => {
    const areaIDList = areaList.map((area) => area.id);
    const areas = areaOptions.map((area) => {
      return { ...area, state: areaIDList.includes(area.id) };
    });
    setAreaListOptions(areas);
  }, [greaterAreaList]);
  //areaOptions

  const handleAreaOption = (option: SetStateAction<string>, id: number) => {
    setAreaOption(option);
    setIsAreaOpen(false);

    const areaIDList = areaList.map((area) => area.id);

    const area: Area = { id: id, name: String(option) };
    if (option === "All areas") {
      // areaOptions.map((area) => {
      //   if (area.id === undefined || area.name === undefined) return {}});
      //select all the greater areas except the first one

      //make the id and name in the areaOptions not undefined

      const areaOptionsSelected = areaOptions.slice(1);
      setAreaList(areaOptionsSelected);
      // setGreaterAreaList(greaterAreaOptions.map((option) => option);
    } else if (!areaIDList.includes(area.id)) {
      setAreaList([...areaList, area]);
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
    setShowArea(!showArea);
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

  //-------------------------------MESSAGES-----------------------------------------
  //All users, pet owners and volunteers that are Active
  const greaterAreaIDList = greaterAreaList.map((area) => area.id);
  const areaIDList = areaList.map((area) => area.id);

  const allUsers = api.communication.getAllUsers.useQuery({ greaterAreaID: greaterAreaIDList, areaID: areaIDList });
  const allPetOwners = api.communication.getAllPetOwners.useQuery({ greaterAreaID: greaterAreaIDList, areaID: areaIDList });
  const allVolunteers = api.communication.getAllVolunteers.useQuery({ greaterAreaID: greaterAreaIDList });
  const [userSuccess, setUserSuccess] = useState("Yes");
  const [petOwnerSuccess, setPetOwnerSuccess] = useState("Yes");
  const [volunteerSuccess, setVolunteerSuccess] = useState("Yes");

  const [userSuccessCount, setUserSuccessCount] = useState(0);
  const [userUnSuccessCount, setUserUnSuccessCount] = useState(0);
  const [petOwnerSuccessCount, setPetOwnerSuccessCount] = useState(0);
  const [petOwnerUnSuccessCount, setPetOwnerUnSuccessCount] = useState(0);
  const [volunteerSuccessCount, setVolunteerSuccessCount] = useState(0);
  const [volunteerUnSuccessCount, setVolunteerUnSuccessCount] = useState(0);

  //-------------------------------CREATE NEW USER-----------------------------------------

  const handleCreateNewUser = async () => {
    setGreaterAreaOption("Select here");
    setAreaOption("Select here");
    setGreaterAreaListOptions(
      greaterAreaOptions.map((area) => {
        return { ...area, state: false };
      }),
    );
    setAreaListOptions(
      areaOptions.map((area) => {
        return { ...area, state: false };
      }),
    );
    setGreaterAreaList([]);
    setAreaList([]);

    // setStartingDate(new Date());
    setMessage("");
    //isCreate ? setIsCreate(false) : setIsCreate(true);
    setIsCreate(true);
  };
  //-------------------------------NEW USER-----------------------------------------

  const handleNewUser = async () => {
    setIsLoading(true);
    //Send user details
    const var_recipients = [];

    //calculate success
    //let var_user_success = "";
    //let var_petOwner_success = "";
    //let var_volunteer_success = "";
    let var_user_success_count = 0;
    let var_user_unsuccess_count = 0;
    let var_petOwner_success_count = 0;
    let var_petOwner_unsuccess_count = 0;
    let var_volunteer_success_count = 0;
    let var_volunteer_unsuccess_count = 0;
    let total_users = 0;

    //Email
    if (preferredOption === "Email") {
      if (includeUser) {
        var_recipients.push("Users");
        setRecipients([...recipients, "Users"]);
        //loop through all the users and send them an email
        allUsers?.data?.map(async (user) => {
          const email = user?.email ?? "";
          total_users = total_users + 1;
          //do a try catch statement here
          try {
            //var_user_success_count = var_user_success_count + 1;
            await sendEmail(message, email);
            console.log("Email sent successfully");
            //var_user_success = "Yes";
            setUserSuccess("Yes");
          } catch (error) {
            var_user_unsuccess_count = var_user_unsuccess_count + 1;
            console.error("Failed to send email", error);
            //var_user_success = "No";
            setUserSuccess("No");
          }
          //await sendEmail(message, email);
        });
      }

      if (includePetOwner) {
        var_recipients.push("Pet Owners");
        setRecipients([...recipients, "Pet Owners"]);
        //loop through all the pet owners and send them an email
        allPetOwners?.data?.map(async (petOwner) => {
          const email = petOwner?.email ?? "";
          //do a try statement here
          try {
            await sendEmail(message, email);
            console.log("Email sent successfully");
            //var_petOwner_success = "Yes";
            var_petOwner_success_count = var_petOwner_success_count + 1;
            setPetOwnerSuccess("Yes");
          } catch (error) {
            console.error("Failed to send email", error);
            //var_petOwner_success = "No";
            setPetOwnerSuccess("No");
            var_petOwner_unsuccess_count = var_petOwner_unsuccess_count + 1;
          }
          // await sendEmail(message, email);
        });
      }

      if (includeVolunteer) {
        var_recipients.push("Volunteers");
        setRecipients([...recipients, "Volunteers"]);
        //loop through all the volunteers and send them an email
        allVolunteers?.data?.map(async (volunteer) => {
          const email = volunteer?.email ?? "";
          //do a ttry statement here
          try {
            await sendEmail(message, email);
            console.log("Email sent successfully");
            //var_volunteer_success = "Yes";
            setVolunteerSuccess("Yes");
            var_volunteer_success_count = var_volunteer_success_count + 1;
          } catch (error) {
            console.error("Failed to send email", error);
            //var_volunteer_success = "No";
            setVolunteerSuccess("No");
            var_volunteer_unsuccess_count = var_volunteer_unsuccess_count + 1;
          }
          //await sendEmail(message, email);
        });
        //await sendEmail(message, email);
      }
    }

    //SMS
    if (preferredOption === "SMS") {
      //const messageContent = "Afripaw Smart App Login Credentials"+"\n\n"+"Dear "+firstName+". Congratulations! You have been registered as a user on the Afripaw Smart App.";

      if (includeUser) {
        var_recipients.push("Users");
        setRecipients([...recipients, "Users"]);
        //loop through all the users
        allUsers?.data?.map(async (user) => {
          const mobile = user?.mobile ?? "";
          const destinationNumber = mobile;
          try {
            await sendSMS(message, destinationNumber);
            console.log("SMS sent successfully");
            //var_user_success = "Yes";
            setUserSuccess("Yes");
            var_user_success_count = var_user_success_count + 1;
          } catch (error) {
            console.error("Failed to send SMS", error);
            //var_user_success = "No";
            setUserSuccess("No");
            var_user_unsuccess_count = var_user_unsuccess_count + 1;
          }
        });
      }

      if (includePetOwner) {
        var_recipients.push("Pet Owners");
        setRecipients([...recipients, "Pet Owners"]);
        //loop through all the pet owners
        allPetOwners?.data?.map(async (petOwner) => {
          const mobile = petOwner?.mobile ?? "";
          const destinationNumber = mobile;
          try {
            await sendSMS(message, destinationNumber);
            console.log("SMS sent successfully");
            setPetOwnerSuccess("Yes");
            var_petOwner_success_count = var_petOwner_success_count + 1;
            //var_petOwner_success = "Yes";
          } catch (error) {
            console.error("Failed to send SMS", error);
            setPetOwnerSuccess("No");
            var_petOwner_unsuccess_count = var_petOwner_unsuccess_count + 1;
            //var_petOwner_success = "No";
          }
        });
      }

      if (includeVolunteer) {
        var_recipients.push("Volunteers");
        setRecipients([...recipients, "Volunteers"]);
        //loop through all the volunteers
        allVolunteers?.data?.map(async (volunteer) => {
          const mobile = volunteer?.mobile ?? "";
          const destinationNumber = mobile;
          try {
            await sendSMS(message, destinationNumber);
            console.log("SMS sent successfully");
            setVolunteerSuccess("Yes");
            var_volunteer_success_count = var_volunteer_success_count + 1;
            //var_volunteer_success = "Yes";
          } catch (error) {
            console.error("Failed to send SMS", error);
            setVolunteerSuccess("No");
            var_volunteer_unsuccess_count = var_volunteer_unsuccess_count + 1;
            //var_volunteer_success = "No";
          }
        });
      }
    }

    // console.log(
    //   "Success rate: ",
    //   var_user_success_count,
    //   var_user_unsuccess_count,
    //   var_petOwner_success_count,
    //   var_petOwner_unsuccess_count,
    //   var_volunteer_success_count,
    //   var_volunteer_unsuccess_count,
    // );
    // console.log("Total users: ", total_users);
    console.log("Before success: ", success);
    let var_success = "";
    if ((userSuccess === "Yes" && includeUser) || (petOwnerSuccess === "Yes" && includePetOwner) || (volunteerSuccess === "Yes" && includeVolunteer)) {
      setSuccess("Yes");
      var_success = "Yes";
      console.log("Success: ", var_success);
    } else {
      setSuccess("No");
      var_success = "No";
      console.log("Success: ", var_success);
    }
    console.log("After success: ", var_success);

    // const recipients = [""];
    // if (includeUser) {
    //   setRecipients([...recipients, "Users"]);
    // }
    // if (includePetOwner) {
    //   setRecipients([...recipients, "Pet Owners"]);
    // }
    // if (includeVolunteer) {
    //   setRecipients([...recipients, "Volunteers"]);
    // }

    console.log("Here are the recipients: ", var_recipients);

    const greaterAreaIDList = greaterAreaList.map((area) => area.id);
    const areaIDList = areaList.map((area) => area.id);

    const newUser_ = await newCommunication.mutateAsync({
      message: message,
      recipients: var_recipients,
      greaterArea: greaterAreaIDList,
      area: areaIDList,
      type: preferredOption,
      success: var_success,
    });

    setIsCreate(false);

    // return newUser_;

    //update identification table
    if (newUser_?.communicationID) {
      console.log("Communication ID: ", newUser_?.communicationID);
      await updateIdentification.mutateAsync({
        communicationID: newUser_?.communicationID ?? 0,
      });
    }

    setMessage("");
    setGreaterAreaOption("Select here");
    setAreaOption("Select here");
    setPreferredCommunicationOption("Select one");
    setSuccess("No");
    setRecipients([]);
    setGreaterAreaList([]);
    setAreaList([]);
    setGreaterAreaListOptions([]);
    setAreaListOptions([]);
    setQuery("");
    setID(0);
    setAreaSelection({ allSelected: false, clear: false });
    setGreaterAreaSelection({ allSelected: false, clear: false });
    setIncludePetOwner(false);
    setIncludeUser(false);
    setIncludeVolunteer(false);

    setIsLoading(false);
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

      const greaterAreas = userData.greaterArea.map((area) => {
        return { id: area.greaterArea.greaterAreaID, name: area.greaterArea.greaterArea };
      });

      const areas = userData.area.map((area) => {
        return { id: area.area.areaID, name: area.area.area };
      });
      setMessage(userData.message ?? "");
      setPreferredCommunicationOption(userData.type ?? "");
      //setType(userData.type ?? "");
      setSuccess(userData.success ?? "No");
      setRecipients(userData.recipients ?? []);
      setGreaterAreaList(greaterAreas ?? []);
      setAreaList(areas ?? []);

      const greaterAreasIDs = greaterAreas.map((area) => area.id);

      setGreaterAreaListOptions(
        greaterAreaOptions.map((area) => ({
          id: area.id,
          name: area.name,
          state: greaterAreasIDs.includes(area.id),
        })),
      );

      const areasIDs = areas.map((area) => area.id);

      setAreaListOptions(
        areaOptions.map((area) => ({
          id: area.id,
          name: area.name,
          state: areasIDs.includes(area.id),
        })),
      );
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

    // setQuery("");
    setIsCreate(false);
    setIsViewProfilePage(false);
    setID(0);
    setMessage("");
    setGreaterAreaOption("Select here");
    setAreaOption("Select here");
    setPreferredCommunicationOption("Select one");
    setSuccess("No");
    setRecipients([]);
    setGreaterAreaList([]);
    setAreaList([]);
    setAreaSelection({ allSelected: false, clear: false });
    setGreaterAreaSelection({ allSelected: false, clear: false });
    setIncludePetOwner(false);
    setIncludeUser(false);
    setIncludeVolunteer(false);
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

    if (message === "") mandatoryFields.push("Message content required");

    //select atleast one recipient
    if (!includeUser && !includePetOwner && !includeVolunteer) mandatoryFields.push("Select at least one recipient class");

    //select preferred communication
    if (preferredOption === "Select one") mandatoryFields.push("Select type of communication");

    //select atleast one field
    if (greaterAreaList.length === 0) mandatoryFields.push("Select at least one recipient greater area");
    if (areaList.length === 0) mandatoryFields.push("Select at least one recipient area");

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

  //------------------------------------------DOWNLOADING COMMUNICATION TABLE TO EXCEL FILE------------------------------------------
  const downloadCommunicationTable = api.communication.download.useQuery({ searchQuery: query });
  const handleDownloadCommunicationTable = async () => {
    setIsLoading(true);
    //take the download user table query data and put it in an excel file
    const data = downloadCommunicationTable.data;
    const fileName = "Communication Table";
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
        <title>Communication Profiles</title>
      </Head>
      <main className="flex flex-col text-normal">
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
                  <button
                    className="absolute left-0 top-0 mx-3 mb-3 rounded-lg bg-main-orange p-3 text-white hover:bg-orange-500"
                    onClick={handleDownloadCommunicationTable}
                  >
                    {isLoading ? (
                      <div
                        className="mx-2 inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-current border-white border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
                        role="status"
                      />
                    ) : (
                      <div>Download Message Table</div>
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
                    Create New Message
                  </button>
                  {/* <button className="absolute left-0 top-0 mx-3 mb-3 rounded-lg bg-main-orange p-3 hover:bg-orange-500" onClick={handleDeleteAllUsers}>
                    Delete all users
                  </button> */}
                </div>
              </div>

              {user_data ? (
                // <article className="my-6 flex max-h-[60%] w-full items-center justify-center overflow-auto rounded-md shadow-inner">
                //   <table className="table-auto">
                //     <thead>
                <article className="my-5 flex w-full justify-center rounded-md shadow-inner">
                  <div className="max-h-[70vh] max-w-7xl overflow-auto">
                    {/* max-h-[60vh] */}
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="z-30 bg-gray-50">
                        <tr>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2"></th>
                          {/* <th className=" px-4 py-2">ID</th> */}
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Message Content</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Type</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Recipients</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">
                            <div className="w-[7rem]">Recipient Greater Area(s)</div>
                          </th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Recipient Area(s)</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Success?</th>
                          <th className="sticky top-0 z-10 w-[35px] bg-gray-50 px-4 py-2">
                            <span className="group relative inline-block">
                              <button className={`${order === "updatedAt" ? "underline" : ""}`} onClick={() => handleOrderFields("updatedAt")}>
                                Date
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
                        {user_data?.map((user, index) => {
                          return (
                            <tr className="items-center">
                              <td className=" border px-2 py-1">
                                <div className="flex justify-center">{index + 1}</div>
                              </td>
                              {/* <td className="border px-2 py-1">M{user.communicationID}</td> */}
                              <td className="max-w-[15rem] border px-2 py-1">
                                {user.message?.length > 100 ? user.message?.substring(0, 100) + "..." : user.message}
                              </td>
                              <td className="border px-2 py-1">{user.type}</td>
                              <td className="border px-2 py-1">
                                {
                                  //Show the list of all the recipients
                                  user.recipients
                                  //user.recipients?.map((user: string) => user).join(", ") ?? ""
                                }
                              </td>
                              <td className="max-w-[10rem] border px-2 py-1">
                                {user.greaterArea.length > 7
                                  ? user.greaterArea
                                      .sort((a, b) => a.greaterArea.greaterAreaID - b.greaterArea.greaterAreaID)
                                      .slice(0, 7)
                                      .map((greaterArea) => greaterArea.greaterArea.greaterArea)
                                      .join("; ") + "..."
                                  : user.greaterArea.map((greaterArea) => greaterArea.greaterArea.greaterArea).join("; ")}
                              </td>
                              <td className="max-w-[15rem] border px-2 py-1">
                                {user.area.length > 7
                                  ? user.area
                                      .sort((a, b) => a.area.areaID - b.area.areaID)
                                      .slice(0, 7)
                                      .map((area) => area.area.area)
                                      .join("; ") + "..."
                                  : user.area.map((area) => area.area.area).join("; ")}
                              </td>
                              <td className="border px-2 py-1">{user.success}</td>
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
                                          user.communicationID ?? 0,
                                          String(user.communicationID),
                                          //get the first 15 charactters of the message
                                          user.message?.length ?? 0 > 15 ? user.message?.substring(0, 15) + "..." : user.message ?? "",
                                        )
                                      }
                                    />
                                    <span className="absolute bottom-full z-50 hidden rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 shadow-sm group-hover:block">
                                      Delete Message
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
                                  <span className="group relative mx-[5px] my-3 mr-[30px] flex items-center justify-center rounded-lg hover:bg-orange-200">
                                    <AddressBook size={24} className="block" onClick={() => handleViewProfilePage(user.communicationID ?? 0)} />
                                    <span className="absolute bottom-full z-50 hidden w-[72px] rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 shadow-sm group-hover:block">
                                      View Message profile
                                    </span>
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
        {isCreate && (
          <>
            <div className="sticky top-[11%] z-50 flex justify-center">
              <div className="relative mb-4 flex grow flex-col items-center rounded-lg bg-slate-300 px-5 py-6">
                <b className=" text-2xl">{"Create New Message"}</b>
                <div className="flex justify-center">
                  <button className="absolute right-0 top-0 m-3 rounded-lg bg-main-orange p-3 text-white hover:bg-orange-500" onClick={handleBackButton}>
                    Back To Message Table
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
              <label>
                {"("}All fields marked <span className="px-1 text-lg text-main-orange">*</span> are compulsary{")"}
              </label>
              <div className="flex w-[46%] flex-col">
                {/*<div className="p-2">User ID: {(lastUserCreated?.data?.userID ?? 1000000) + 1}</div>*/}
                <div className="relative my-2 flex w-full flex-col rounded-lg border-2 bg-slate-200 p-4">
                  <b className="mb-3 text-center text-xl">Communication Data</b>

                  <div className="flex py-2">
                    Message ID: <div className="px-3">M{isCreate ? String((latestCommunicationID?.data?.communicationID ?? 0) + 1) : id}</div>
                  </div>
                  <div className="flex items-start">
                    <label className=" w-32 pt-3">
                      Message<span className="text-lg text-main-orange">*</span>:{" "}
                    </label>
                    <textarea
                      className="m-2 h-24 w-full rounded-lg border-2 border-slate-300 px-2 focus:border-black"
                      placeholder="Type here..."
                      onChange={(e) => setMessage(e.target.value)}
                      value={message}
                    />
                  </div>

                  {/*Make checkboxes to select a user */}
                  <div className="flex flex-col items-center">
                    <label>
                      Select Recipient(s)<span className="text-lg text-main-orange">*</span>
                    </label>
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
                            Active Users
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
                            Active Pet Owners
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
                          Active Volunteers
                        </label>
                      </div>
                    </div>
                  </div>

                  {(includeUser || includePetOwner || includeVolunteer) && (
                    <>
                      {/* Greater Area */}
                      <div className="flex items-start">
                        <div className="mr-3 flex items-center pt-4">
                          <label>
                            Greater Area(s)<span className="text-lg text-main-orange">*</span>:{" "}
                          </label>
                        </div>

                        {/* <div className="flex flex-col items-center">
                          <button
                            onClick={handleShowGreaterArea}
                            className="mb-2 mr-3 mt-3 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                          >
                            Show all greater areas of recipients
                          </button>
                          {showGreaterArea && (
                            <ul className="mr-3 w-full rounded-lg bg-white px-5 py-2 text-sm text-gray-700 dark:text-gray-200">
                              {greaterAreaList.map((greaterArea) => (
                                <li key={greaterArea.id} className=" py-2">
                                  {greaterArea.name}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div> */}

                        <div className="flex flex-col">
                          <button
                            ref={btnGreaterAreaRef}
                            className="my-3 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                            type="button"
                            onClick={handleToggleGreaterArea}
                          >
                            {greaterAreaOption}
                            <svg className="ms-3 h-2.5 w-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                            </svg>
                          </button>
                          {isGreaterAreaOpen && (
                            <div ref={greaterAreaRef} className="z-10 w-44 divide-y divide-gray-100 rounded-lg bg-white shadow dark:bg-gray-700">
                              <ul className="py-2 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdownHoverButton">
                                <li key={1}>
                                  <div className="flex items-center px-4">
                                    <input
                                      id="1"
                                      type="checkbox"
                                      checked={greaterAreaSelection?.allSelected}
                                      onChange={(e) => handleGreaterArea(0, "", e.target.checked, "allSelected")}
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
                                      checked={greaterAreaSelection?.clear}
                                      onChange={(e) => handleGreaterArea(0, "", e.target.checked, "clear")}
                                      className="h-4 w-4 rounded bg-gray-100 text-main-orange accent-main-orange focus:ring-2"
                                    />
                                    <label htmlFor="2" className="ms-2 text-sm font-bold text-gray-900">
                                      Clear All
                                    </label>
                                  </div>
                                </li>
                                {greaterAreaListOptions?.map((option) => (
                                  <li key={option.id}>
                                    <div className="flex items-center px-4">
                                      <input
                                        id={String(option.id)}
                                        type="checkbox"
                                        checked={option.state}
                                        onChange={(e) => handleGreaterArea(option.id, option.name, e.target.checked, "normal")}
                                        className="h-4 w-4 rounded bg-gray-100 text-main-orange accent-main-orange focus:ring-2"
                                      />
                                      <label htmlFor={String(option.id)} className="ms-2 text-sm font-medium text-gray-900">
                                        {option.name}
                                      </label>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                        {/* <div className="flex flex-col">
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
                                  <li key={option.id} onClick={() => handleGreaterAreaOption(option.name, option.id)}>
                                    <button className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">{option.name}</button>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div> */}
                      </div>

                      {/* Area */}
                      <div className="flex items-start">
                        <div className="mr-3 flex items-center pt-4">
                          <label>
                            Area(s)<span className="text-lg text-main-orange">*</span>:{" "}
                          </label>
                        </div>

                        {/* <div className="flex flex-col items-center">
                          <button
                            onClick={handleShowArea}
                            className="mb-2 mr-3 mt-3 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                          >
                            Show all areas of recipients
                          </button>
                          {showArea && (
                            <ul className="mr-3 w-full rounded-lg bg-white px-5 py-2 text-sm text-gray-700 dark:text-gray-200">
                              {areaList.map((area) => (
                                <li key={area.id} className=" py-2">
                                  {area.name}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div> */}

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
                                <li key={1}>
                                  <div className="flex items-center px-4">
                                    <input
                                      id="1"
                                      type="checkbox"
                                      checked={areaSelection?.allSelected}
                                      onChange={(e) => handleArea(0, "", e.target.checked, "allSelected")}
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
                                      checked={areaSelection?.clear}
                                      onChange={(e) => handleArea(0, "", e.target.checked, "clear")}
                                      className="h-4 w-4 rounded bg-gray-100 text-main-orange accent-main-orange focus:ring-2"
                                    />
                                    <label htmlFor="2" className="ms-2 text-sm font-bold text-gray-900">
                                      Clear All
                                    </label>
                                  </div>
                                </li>
                                {areaListOptions?.map((option) => (
                                  <li key={option.id}>
                                    <div className="flex items-center px-4">
                                      <input
                                        id={String(option.id)}
                                        type="checkbox"
                                        checked={option.state}
                                        onChange={(e) => handleArea(option.id, option.name, e.target.checked, "normal")}
                                        className="h-4 w-4 rounded bg-gray-100 text-main-orange accent-main-orange focus:ring-2"
                                      />
                                      <label htmlFor={String(option.id)} className="ms-2 text-sm font-medium text-gray-900">
                                        {option.name}
                                      </label>
                                    </div>
                                  </li>
                                ))}
                              </ul>

                              {/* <ul className="py-2 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdownHoverButton">
                                {areaOptions.map((option) => (
                                  <li key={option.id} onClick={() => handleAreaOption(option.name, option.id)}>
                                    <button className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">{option.name}</button>
                                  </li>
                                ))}
                              </ul> */}
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {/*PREFERRED  COMMUNICATION*/}
                  <div className="flex items-start">
                    <div className="mr-3 flex items-center pt-5">
                      <label>
                        Type of Communication<span className="text-lg text-main-orange">*</span>:{" "}
                      </label>
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
                {isLoading ? (
                  <div
                    className="mx-2 inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-current border-white border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
                    role="status"
                  />
                ) : (
                  <div>Send Message</div>
                )}
              </button>
            </div>
          </>
        )}

        {isViewProfilePage && (
          <>
            <div className="sticky top-[11%] z-50 flex justify-center">
              <div className="relative mb-4 flex grow flex-col items-center rounded-lg bg-slate-300 px-5 py-6">
                <div className=" text-2xl">Message Profile</div>
                <div className="flex justify-center">
                  <button className="absolute right-0 top-0 m-3 rounded-lg bg-main-orange p-3 text-white hover:bg-orange-500" onClick={handleBackButton}>
                    Back To Message table
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

                  <b className="mb-14 text-center text-xl">Message Data</b>
                  <div className="mb-2 flex items-center">
                    <b className="mr-3">Message ID:</b> M{id}
                  </div>

                  <div className="mb-2 flex items-center">
                    <b className="mr-3">Message:</b>{" "}
                    {
                      message
                      // //Just get the first 15 characters of the message
                      // message?.length > 15 ? message?.substring(0, 15) + "..." : message
                    }
                  </div>

                  <div className="mb-2 flex items-center">
                    <b className="mr-3">Type:</b> {preferredOption}
                  </div>

                  <div className="mb-2 flex items-center">
                    <b className="mr-3">Recipient(s):</b> {recipients.map((recipient) => recipient).join("; ")}
                  </div>

                  <div className="mb-2 flex items-center">
                    <b className="mr-3">Greater Area(s):</b>{" "}
                    {greaterAreaList
                      .sort((a, b) => a.id - b.id)
                      .map((greaterArea) => greaterArea.name)
                      .join("; ")}
                  </div>

                  <div className="mb-2 flex items-center">
                    <b className="mr-3">Area(s):</b>{" "}
                    {areaList
                      .sort((a, b) => a.id - b.id)
                      .map((area) => area.name)
                      .join("; ")}
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
