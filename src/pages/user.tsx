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
//import { areaOptions } from "~/components/GeoLocation/areaOptions";
import { areaStreetMapping } from "~/components/GeoLocation/areaStreetMapping";
import { sendUserCredentialsEmail } from "~/components/CommunicationPortals/email";
import { sendSMS } from "~/pages/api/smsPortal";

//Icons
import { AddressBook, Pencil, Printer, Trash, UserCircle, Users } from "phosphor-react";

//Date picker
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { UploadButton } from "~/utils/uploadthing";
import { useSession } from "next-auth/react";
import Input from "~/components/Base/Input";
import { bg } from "date-fns/locale";
import { set } from "date-fns";

//Excel
import * as XLSX from "xlsx";

//File saver
//import FileSaver from "file-saver";
import * as FileSaver from "file-saver";

const User: NextPage = () => {
  useSession({ required: true });

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

  //---------------------------------AREA-----------------------------------------------
  type Area = {
    id: number;
    area: string;
  };

  type AreaOptions = {
    id: number;
    area: string;
    state: boolean;
  };

  //---------------------------------STREET-----------------------------------------------
  type Street = {
    id: number;
    street: string;
  };

  type StreetOptions = {
    id: number;
    street: string;
    state: boolean;
  };

  //---------------------------------PREFERRED COMMUNICATION-----------------------------------------------
  type PreferredCommunication = {
    communication: string;
    state: boolean;
  };

  //---------------------------------ROLE-----------------------------------------------
  type Role = {
    role: string;
    state: boolean;
  };

  //---------------------------------STATUS-----------------------------------------------
  type Status = {
    status: string;
    state: boolean;
  };

  const newUser = api.user.create.useMutation();
  const updateUser = api.user.update.useMutation();
  const [isUpdate, setIsUpdate] = useState(false);
  const [isCreate, setIsCreate] = useState(false);
  //Update the table when user is deleted
  const [isDeleted, setIsDeleted] = useState(false);

  //-------------------------------LOADING ANIMATIONS-----------------------------------------
  const [isLoading, setIsLoading] = useState(false);

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

  //-------------------------------IDENTIFICATION-----------------------------------------
  const identification = api.user.createIdentification.useMutation();
  const updateIdentification = api.user.updateIdentification.useMutation();

  const handleCreateIdentification = async (
    userID: number,
    volunteerID: number,
    petOwnerID: number,
    petID: number,
    treatmentID: number,
    clinicID: number,
    communicationID: number,
    greaterAreaID: number,
  ) => {
    await identification.mutateAsync({
      userID: userID,
      volunteerID: volunteerID,
      petID: petID,
      petOwnerID: petOwnerID,
      clinicID: clinicID,
      treatmentID: treatmentID,
      communicationID: communicationID,
      greaterAreaID: greaterAreaID,
    });
  };

  const deletAllIdentifications = api.user.deleteAllIdentification.useMutation();
  const handleDeleteAllIdentifications = async () => {
    await deletAllIdentifications.mutateAsync();
  };

  //get latest userID
  const latestUserID = api.user.getLatestUserID.useQuery();

  //-------------------------------TABLE-----------------------------------------
  //const data = api.user.searchUsers.useQuery({ searchQuery: query });
  //delete specific row
  const deleteRow = api.user.deleteUser.useMutation();
  const handleDeleteRow = async (id: string) => {
    setIsDeleteModalOpen(false);
    await deleteRow.mutateAsync({ userID: id });
    isDeleted ? setIsDeleted(false) : setIsDeleted(true);
  };

  //autoload the table
  /* useEffect(() => {
    void data.refetch();
  }, [isUpdate, isDeleted, isCreate]);*/

  //-------------------------------EMAILS-----------------------------------------
  // Example of a function in your Next.js application to call the send API
  // async function sendEmail(firstName: string, email: string) {
  //   const response = await fetch("/api/send", {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json",
  //     },
  //     body: JSON.stringify({ firstName, email }),
  //   });
  //   console.log("response: ", response);

  //   if (!response.ok) {
  //     console.error("Failed to send email");
  //     // Handle response errors
  //     const errorData = (await response.json()) as { message?: string };
  //     throw new Error(errorData.message ?? "Failed to send email");
  //   }

  //   // Safely parse the successful response
  //   const responseData: unknown = await response.json(); // Use `unknown` instead of `any` for safer type checking
  //   console.log("responseData: ", responseData);
  //   // You need to cast this `unknown` to a more specific type based on what you expect from the response
  //   return responseData; // Or handle the successful response as needed
  // }

  // const utils = api.getUtils();
  async function sendEmail(firstName: string, email: string, id: string, password: string, typeOfUser: string): Promise<void> {
    //   await utils.user.sendEmail.fetch({ firstName, email, id, password, typeOfUser });

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

  //-------------------------------ID-----------------------------------------
  const [id, setID] = useState("");

  //Order fields
  const [order, setOrder] = useState("surname");

  //view profile page
  const [isViewProfilePage, setIsViewProfilePage] = useState(false);

  //Done uploading images
  const [isDoneUploading, setIsDoneUploading] = useState(false);

  //-------------------------------INFINITE SCROLLING WITH INTERSECTION OBSERVER-----------------------------------------
  const observerTarget = useRef<HTMLDivElement | null>(null);

  const [limit] = useState(12);
  const {
    data: queryData,
    fetchNextPage,
    hasNextPage,
    refetch,
  } = api.user.searchUsersInfinite.useInfiniteQuery(
    {
      id: id,
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
  }, [isUpdate, isDeleted, isCreate, query, order, isViewProfilePage, isDoneUploading]);

  const user = user_data?.find((user) => user.id === id);

  //-------------------------------DELETE ALL USERS-----------------------------------------
  //Delete all users
  const deleteAllUsers = api.user.deleteAll.useMutation();
  const handleDeleteAllUsers = async () => {
    await deleteAllUsers.mutateAsync();
    isDeleted ? setIsDeleted(false) : setIsDeleted(true);
  };

  //---------------------------------PRINTING----------------------------------
  const printComponentRef = useRef(null);

  //---------------------------------EDIT BOXES----------------------------------
  const [userID, setUserID] = useState(0);
  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [addressFreeForm, setAddressFreeForm] = useState("");
  const [addressStreetCode, setAddressStreetCode] = useState("");
  const [addressStreetNumber, setAddressStreetNumber] = useState("");
  const [addressSuburb, setAddressSuburb] = useState("");
  const [addressPostalCode, setAddressPostalCode] = useState("");
  const [comments, setComments] = useState("");
  const [startingDate, setStartingDate] = useState(new Date());
  const [image, setImage] = useState("");

  //-----------------------------------------------PASSWORDS-----------------------------------------------
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatePassword, setIsUpdatePassword] = useState(false);
  //autogenerated password
  const lowerCaseLetters = "abcdefghijklmnopqrstuvwxyz";
  const upperCaseLetters = lowerCaseLetters.toUpperCase();
  const specialCharacters = "!@#$%^&*_+:<>?|;/";
  const numberCharacters = "0123456789";
  const allCharacters = lowerCaseLetters + upperCaseLetters + numberCharacters;

  const handleAutogeneratePassword = () => {
    let newPassword = "";
    newPassword += lowerCaseLetters[Math.floor(Math.random() * lowerCaseLetters.length)];
    newPassword += upperCaseLetters[Math.floor(Math.random() * upperCaseLetters.length)];
    //newPassword += specialCharacters[Math.floor(Math.random() * specialCharacters.length)];
    newPassword += numberCharacters[Math.floor(Math.random() * numberCharacters.length)];

    const remainingLength = 8 - newPassword.length;
    for (let i = 0; i < remainingLength; i++) {
      newPassword += allCharacters[Math.floor(Math.random() * allCharacters.length)];
    }
    //Put special character before or after the password
    if (Math.random() < 0.5) {
      newPassword += specialCharacters[Math.floor(Math.random() * specialCharacters.length)];
    } else {
      newPassword = specialCharacters[Math.floor(Math.random() * specialCharacters.length)] + newPassword;
    }

    setPassword(newPassword);
    setConfirmPassword(newPassword);
  };

  //userID
  //const [userID, setUserID] = useState("");
  // const [id, setID] = useState("");

  //-------------------------------UPDATE USER-----------------------------------------
  // const user = api.user.getUserByID.useQuery({ id: id });

  //Order fields
  // const [order, setOrder] = useState("surname");

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

  const [streetID, setStreetID] = useState(0);
  const [isStreetOpen, setIsStreetOpen] = useState(false);
  const [streetOption, setStreetOption] = useState<Street>({ street: "Select one", id: 0 });
  const streetRef = useRef<HTMLDivElement>(null);
  const btnStreetRef = useRef<HTMLButtonElement>(null);
  //const [streetOptions, setStreetOptions] = useState<string[]>([]);

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
  const greaterAreaOptions = api.geographic.getAllGreaterAreas.useQuery()?.data ?? [];
  const handleToggleGreaterArea = () => {
    setIsGreaterAreaOpen(!isGreaterAreaOpen);
  };

  const handleGreaterAreaOption = (option: SetStateAction<string>, id: number) => {
    const greaterArea: GreaterArea = { area: String(option), id: id };
    setGreaterAreaOption(greaterArea);
    setIsGreaterAreaOpen(false);
  };

  const [deselectGreaterArea, setDeselectGreaterArea] = useState("No");
  const [greaterAreaListOptions, setGreaterAreaListOptions] = useState<GreaterAreaOptions[]>([]);

  useEffect(() => {
    if (greaterAreaOptions.length > 0) {
      setGreaterAreaListOptions(greaterAreaOptions.map((item) => ({ area: item.greaterArea, id: item.greaterAreaID, state: false })));
    }
  }, [isCreate]);

  const handleGreaterArea = (id: number, area: SetStateAction<string>, deselect: string) => {
    if (deselect === "Yes") {
      setDeselectGreaterArea("Yes");
      setGreaterAreaOption({ area: "Select one", id: 0 });
      setGreaterAreaListOptions(greaterAreaListOptions.map((item) => ({ ...item, state: false })));
    } else if (deselect === "No") {
      setDeselectGreaterArea("No");
      setGreaterAreaListOptions(greaterAreaListOptions.map((item) => (item.area === area ? { ...item, state: true } : { ...item, state: false })));
      const greaterArea = { area: String(area), id: id };
      setGreaterAreaOption(greaterArea);
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

  //const greaterAreaOptions = ["Flagship", "Replication area 1", "Replication area 2"];
  // const greaterAreaOptions = api.geographic.getAllGreaterAreas.useQuery()?.data ?? [];

  //AREA
  const areaOptions = api.geographic.getAreasByGreaterID.useQuery({ greaterAreaID: greaterAreaOption.id })?.data ?? [];
  const handleToggleArea = () => {
    setIsAreaOpen(!isAreaOpen);
    setStreetOption({ street: "Select one", id: 0 });
  };

  //SetStateAction<string>
  const handleAreaOption = (option: string, id: number) => {
    const area: Area = { area: String(option), id: id };
    setAreaOption(area);
    setIsAreaOpen(false);
  };

  const [deselectArea, setDeselectArea] = useState("No");
  const [areaListOptions, setAreaListOptions] = useState<AreaOptions[]>([]);

  useEffect(() => {
    if (areaOptions.length > 0) {
      setAreaListOptions(areaOptions.map((item) => ({ area: item.area, id: item.areaID, state: areaOption.id === item.areaID ? true : false })));
    }
    if (greaterAreaOption.area === "Select one") {
      setAreaListOptions([]);
    }
  }, [isCreate, areaOptions, greaterAreaOption]);

  const handleArea = (id: number, area: SetStateAction<string>, deselect: string) => {
    if (deselect === "Yes") {
      setDeselectArea("Yes");
      setAreaOption({ area: "Select one", id: 0 });
      const areas = areaOptions.map((item) => ({ area: item.area, id: item.areaID, state: false }));
      setAreaListOptions(areas);
      //setAreaListOptions(areaListOptions.map((item) => ({ ...item, state: false })));
    } else if (deselect === "No") {
      setDeselectArea("No");
      setAreaListOptions(areaListOptions.map((item) => (item.area === area ? { ...item, state: true } : { ...item, state: false })));
      const area_ = { area: String(area), id: id };
      setAreaOption(area_);
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

  //STREET
  const streetOptions = api.geographic.getStreetsByAreaID.useQuery({ areaID: areaOption.id })?.data ?? [];

  const handleToggleStreet = () => {
    setIsStreetOpen(!isStreetOpen);
  };

  const handleStreetOption = (option: string, id: number) => {
    const street: Street = { street: String(option), id: id };
    setStreetOption(street);
    setIsStreetOpen(false);
  };

  const [deselectStreet, setDeselectStreet] = useState("No");
  const [streetListOptions, setStreetListOptions] = useState<StreetOptions[]>([]);

  useEffect(() => {
    if (streetOptions.length > 0) {
      setStreetListOptions(streetOptions.map((item) => ({ street: item.street, id: item.streetID, state: streetOption.id === item.streetID ? true : false })));
    }
    if (areaOption.area === "Select one") {
      setStreetListOptions([]);
    }
  }, [isCreate, streetOptions, areaOption]);

  const handleStreet = (id: number, street: SetStateAction<string>, deselect: string) => {
    if (deselect === "Yes") {
      setDeselectStreet("Yes");
      setStreetOption({ street: "Select one", id: 0 });
      const streets = streetOptions.map((item) => ({ street: item.street, id: item.streetID, state: false }));
      setStreetListOptions(streets);
      //setAreaListOptions(areaListOptions.map((item) => ({ ...item, state: false })));
    } else if (deselect === "No") {
      setDeselectStreet("No");
      setStreetListOptions(streetListOptions.map((item) => (item.street === street ? { ...item, state: true } : { ...item, state: false })));
      const street_ = { street: String(street), id: id };
      setStreetOption(street_);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        streetRef.current &&
        !streetRef.current.contains(event.target as Node) &&
        btnStreetRef.current &&
        !btnStreetRef.current.contains(event.target as Node)
      ) {
        setIsStreetOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  //PREFERRED COMMUNICATION
  const [deselectPreferredCommunication, setDeselectPreferredCommunication] = useState("No");
  const [preferredCommunicationListOptions, setPreferredCommunicationListOptions] = useState<PreferredCommunication[]>([
    { communication: "SMS", state: false },
  ]);

  const handleTogglePreferredCommunication = () => {
    setPreferredCommunication(!preferredCommunication);
  };

  const handlePreferredCommunicationOption = (option: SetStateAction<string>) => {
    setPreferredCommunicationOption(option);
    setPreferredCommunication(false);
  };

  useEffect(() => {
    if (email === "") {
      setPreferredCommunicationListOptions([{ communication: "SMS", state: false }]);
    } else if (email != "") {
      setPreferredCommunicationListOptions([
        { communication: "Email", state: false },
        { communication: "SMS", state: false },
      ]);
    }
  }, [email]);

  const handlePreferredCommunication = (option: SetStateAction<string>, deselect: string) => {
    if (deselect === "Yes") {
      setDeselectPreferredCommunication("Yes");
      setPreferredCommunicationOption("Select one");
      setPreferredCommunicationListOptions(preferredCommunicationListOptions.map((item) => ({ ...item, state: false })));
    } else if (deselect === "No") {
      setDeselectPreferredCommunication("No");
      setPreferredCommunicationListOptions(
        preferredCommunicationListOptions.map((item) => (item.communication === option ? { ...item, state: true } : { ...item, state: false })),
      );
      setPreferredCommunicationOption(option);
    }
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

  //old code
  const [preferredCommunicationOptions, setPreferredCommunicationOptions] = useState(["SMS"]);
  useEffect(() => {
    if (email === "") {
      setPreferredCommunicationOptions(["SMS"]);
    } else if (email != "") {
      setPreferredCommunicationOptions(["Email", "SMS"]);
    }
  }, [email]);

  //ROLE
  const handleToggleRole = () => {
    setRole(!role);
  };

  const handleRoleOption = (option: SetStateAction<string>) => {
    setRoleOption(option);
    setRole(false);
  };

  const [deselectRole, setDeselectRole] = useState("No");
  const [roleListOptions, setRoleListOptions] = useState<Role[]>([
    { role: "System Administrator", state: false },
    { role: "Data Analyst", state: false },
    { role: "Data Consumer", state: false },
    { role: "Treatment Data Capturer", state: false },
    { role: "General Data Capturer", state: false },
  ]);

  const handleRole = (option: SetStateAction<string>, deselect: string) => {
    if (deselect === "Yes") {
      setDeselectRole("Yes");
      setRoleOption("Select one");
      setRoleListOptions(roleListOptions.map((item) => ({ ...item, state: false })));
    } else if (deselect === "No") {
      setDeselectRole("No");
      setRoleListOptions(roleListOptions.map((item) => (item.role === option ? { ...item, state: true } : { ...item, state: false })));
      setRoleOption(option);
    }
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

  const [deselectStatus, setDeselectStatus] = useState("No");
  const [statusListOptions, setStatusListOptions] = useState<Status[]>([
    { status: "Active", state: false },
    { status: "Passive", state: false },
  ]);

  const handleStatus = (option: SetStateAction<string>, deselect: string) => {
    if (deselect === "Yes") {
      setDeselectStatus("Yes");
      setStatusOption("Select one");
      setStatusListOptions(statusListOptions.map((item) => ({ ...item, state: false })));
    } else if (deselect === "No") {
      setDeselectStatus("No");
      setStatusListOptions(statusListOptions.map((item) => (item.status === option ? { ...item, state: true } : { ...item, state: false })));
      setStatusOption(option);
    }
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
  const [sendUserDetails, setSendUserDetails] = useState(false);

  //-------------------------------UPDATE USER-----------------------------------------

  // //GEOGRAPHIC LOCATION
  // const getGreaterAreaByID = api.geographic.getGreaterAreaByID.useQuery({ greaterAreaID: greaterAreaID });
  // const getAreaByID = api.geographic.getAreaByID.useQuery({ areaID: areaID });
  // const getStreetByID = api.geographic.getStreetByID.useQuery({ streetID: streetID });
  //Update the user's details in fields
  const handleUpdateUserProfile = async (id: string) => {
    setID(id);
    const user = user_data?.find((user) => user.id === id);
    if (user) {
      // Assuming userQuery.data contains the user object
      const userData = user;
      setUserID(userData.userID ?? 0);
      setFirstName(userData.name ?? "");
      setSurname(userData.surname ?? "");
      setEmail(userData.email ?? "");
      setMobile(userData.mobile ?? "");
      setGreaterAreaID(userData.addressGreaterAreaID ?? 0);
      setAreaID(userData.addressAreaID ?? 0);
      setStreetID(userData.addressStreetID ?? 0);
      setAddressStreetCode(userData.addressStreetCode ?? "");
      setAddressStreetNumber(userData.addressStreetNumber ?? "");
      setAddressSuburb(userData.addressSuburb ?? "");
      setAddressPostalCode(userData.addressPostalCode ?? "");
      setAddressFreeForm(userData.addressFreeForm ?? "");
      setPreferredCommunicationOption(userData.preferredCommunication ?? "Select one");
      setStartingDate(userData.startingDate ?? new Date());
      setRoleOption(userData.role ?? "Select one");
      setStatusOption(userData.status ?? "Select one");
      setComments(userData.comments ?? "");
      setImage(userData.image ?? "");

      const greaterArea: GreaterArea = { area: userData.addressGreaterArea.greaterArea ?? "Select one", id: userData.addressGreaterAreaID ?? 0 };

      setGreaterAreaOption(greaterArea);

      const greaterAreas = greaterAreaOptions.map((item) => ({
        area: item.greaterArea,
        id: item.greaterAreaID,
        state: item.greaterArea === userData.addressGreaterArea.greaterArea ? true : false,
      }));
      setGreaterAreaListOptions(greaterAreas);

      const area: Area = { area: userData.addressArea?.area ?? "Select one", id: userData.addressAreaID ?? 0 };

      setAreaOption(area);

      const areas = areaOptions.map((item) => ({
        area: item.area,
        id: item.areaID,
        state: item.area === userData.addressArea?.area ? true : false,
      }));
      setAreaListOptions(areas);

      const street: Street = { street: userData.addressStreet?.street ?? "Select one", id: userData.addressStreetID ?? 0 };

      setStreetOption(street);

      const streets = streetOptions.map((item) => ({
        street: item.street,
        id: item.streetID,
        state: item.street === userData.addressStreet?.street ? true : false,
      }));
      setStreetListOptions(streets);

      if (userData.email === "") {
        setPreferredCommunicationListOptions([{ communication: "SMS", state: userData.preferredCommunication === "SMS" ? true : false }]);
      } else if (userData.email != "") {
        setPreferredCommunicationListOptions([
          { communication: "Email", state: userData.preferredCommunication === "Email" ? true : false },
          { communication: "SMS", state: userData.preferredCommunication === "SMS" ? true : false },
        ]);
      }

      setRoleListOptions(roleListOptions.map((item) => (item.role === userData.role ? { ...item, state: true } : { ...item, state: false })));

      setStatusListOptions(statusListOptions.map((item) => (item.status === userData.status ? { ...item, state: true } : { ...item, state: false })));

      setDeselectGreaterArea("No");
      setDeselectArea("No");
      setDeselectPreferredCommunication("No");
      setDeselectStreet("No");
      setDeselectRole("No");
      setDeselectStatus("No");

      // setPreferredCommunicationListOptions(
      //   preferredCommunicationListOptions.map((item) => (item.communication === userData.preferredCommunication ? { ...item, state: "Yes" } : { ...item, state: "No" })),
      // );

      //Make sure thet area and street options have a value
      if (userData.addressAreaID === 0 || userData.addressAreaID === undefined) {
        setAreaOption({ area: "Select one", id: 0 });
      }
      if (userData.addressStreetID === 0 || userData.addressStreetID === undefined) {
        setStreetOption({ street: "Select one", id: 0 });
      }
    }

    //isUpdate ? setIsUpdate(true) : setIsUpdate(true);
    //isCreate ? setIsCreate(false) : setIsCreate(false);
    setIsUpdate(true);
    setIsUpdatePassword(true);
    setIsCreate(false);
  };

  useEffect(() => {
    if (user) {
      // Assuming userQuery.data contains the user object
      const userData = user;
      setUserID(userData.userID ?? 0);
      setFirstName(userData.name ?? "");
      setSurname(userData.surname ?? "");
      setEmail(userData.email ?? "");
      setMobile(userData.mobile ?? "");
      setGreaterAreaID(userData.addressGreaterAreaID ?? 0);
      setAreaID(userData.addressAreaID ?? 0);
      setStreetID(userData.addressStreetID ?? 0);
      setAddressStreetCode(userData.addressStreetCode ?? "");
      setAddressStreetNumber(userData.addressStreetNumber ?? "");
      setAddressSuburb(userData.addressSuburb ?? "");
      setAddressPostalCode(userData.addressPostalCode ?? "");
      setAddressFreeForm(userData.addressFreeForm ?? "");
      setPreferredCommunicationOption(userData.preferredCommunication ?? "Select one");
      setStartingDate(userData.startingDate ?? new Date());
      setRoleOption(userData.role ?? "Select one");
      setStatusOption(userData.status ?? "Select one");
      setComments(userData.comments ?? "");
      setImage(userData.image ?? "");

      const greaterArea: GreaterArea = { area: userData.addressGreaterArea.greaterArea ?? "Select one", id: userData.addressGreaterAreaID ?? 0 };

      setGreaterAreaOption(greaterArea);

      const greaterAreas = greaterAreaOptions.map((item) => ({
        area: item.greaterArea,
        id: item.greaterAreaID,
        state: item.greaterArea === userData.addressGreaterArea.greaterArea ? true : false,
      }));
      setGreaterAreaListOptions(greaterAreas);

      const area: Area = { area: userData.addressArea?.area ?? "Select one", id: userData.addressAreaID ?? 0 };

      setAreaOption(area);

      const areas = areaOptions.map((item) => ({
        area: item.area,
        id: item.areaID,
        state: item.area === userData.addressArea?.area ? true : false,
      }));
      setAreaListOptions(areas);

      const street: Street = { street: userData.addressStreet?.street ?? "Select one", id: userData.addressStreetID ?? 0 };

      setStreetOption(street);

      const streets = streetOptions.map((item) => ({
        street: item.street,
        id: item.streetID,
        state: item.street === userData.addressStreet?.street ? true : false,
      }));
      setStreetListOptions(streets);

      if (userData.email === "") {
        setPreferredCommunicationListOptions([{ communication: "SMS", state: userData.preferredCommunication === "SMS" ? true : false }]);
      } else if (userData.email != "") {
        setPreferredCommunicationListOptions([
          { communication: "Email", state: userData.preferredCommunication === "Email" ? true : false },
          { communication: "SMS", state: userData.preferredCommunication === "SMS" ? true : false },
        ]);
      }

      setRoleListOptions(roleListOptions.map((item) => (item.role === userData.role ? { ...item, state: true } : { ...item, state: false })));

      setStatusListOptions(statusListOptions.map((item) => (item.status === userData.status ? { ...item, state: true } : { ...item, state: false })));

      // setPreferredCommunicationListOptions(
      //   preferredCommunicationListOptions.map((item) => (item.communication === userData.preferredCommunication ? { ...item, state: "Yes" } : { ...item, state: "No" })),
      // );

      //Make sure thet area and street options have a value
      if (userData.addressAreaID === 0 || userData.addressAreaID === undefined) {
        setAreaOption({ area: "Select one", id: 0 });
      }
      if (userData.addressStreetID === 0 || userData.addressStreetID === undefined) {
        setStreetOption({ street: "Select one", id: 0 });
      }
    }
  }, [isUpdate, isCreate]); // Effect runs when userQuery.data changes

  const handleUpdateUser = async () => {
    setIsLoading(true);

    console.log("Search Query!!!!: ", query);

    const user = await updateUser.mutateAsync({
      id: id,
      firstName: firstName,
      email: email,
      surname: surname,
      mobile: mobile,
      addressGreaterAreaID: greaterAreaOption.area === "Select one" ? 0 : greaterAreaOption.id,
      addressAreaID: areaOption.area === "Select one" ? 0 : areaOption.id,
      addressStreetID: streetOption.street === "Select one" ? 0 : streetOption.id,
      addressStreetCode: addressStreetCode,
      addressStreetNumber: addressStreetNumber,
      addressSuburb: addressSuburb,
      addressPostalCode: addressPostalCode,
      addressFreeForm: addressFreeForm,
      preferredCommunication: preferredOption === "Select one" ? "" : preferredOption,
      startingDate: startingDate,
      role: roleOption === "Select one" ? "" : roleOption,
      status: statusOption === "Select one" ? "" : statusOption,
      comments: comments,
      password: password,
    });

    //Send user details
    //Email
    if (preferredOption === "Email" && sendUserDetails && user?.userID && password !== "") {
      await sendEmail(firstName, email, String(user.userID), password, "user");
    }

    if (preferredOption === "SMS" && sendUserDetails && user?.userID && password !== "") {
      const messageContent =
        "Dear " +
        firstName +
        ",\n" +
        "Your AfriPaw Smart App (https://afripaw.app) user ID is: " +
        "U" +
        user?.userID +
        "\n" +
        "Your username is: " +
        id +
        "\n" +
        "Your password is: " +
        password +
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
    //After the newUser has been created make sure to set the fields back to empty
    setUserID(0);
    setFirstName("");
    setEmail("");
    setSurname("");
    setPassword("");
    setConfirmPassword("");
    setMobile("");
    setGreaterAreaOption({ area: "Select one", id: 0 });
    //setGreaterAreaID(0);
    setAreaOption({ area: "Select one", id: 0 });
    //setAreaID(0);
    setStreetOption({ street: "Select one", id: 0 });
    //setStreetID(0);
    setAddressStreetCode("");
    setAddressStreetNumber("");
    setAddressSuburb("");
    setAddressPostalCode("");
    setAddressFreeForm("");
    setPreferredCommunicationOption("Select one");
    setRoleOption("Select one");
    setStatusOption("Select one");
    setComments("");
    setIsUpdate(false);
    setIsCreate(false);
    setIsUpdatePassword(false);
    setPreferredCommunicationListOptions([{ communication: "SMS", state: false }]);
    setGreaterAreaListOptions(greaterAreaOptions.map((item) => ({ area: item.greaterArea, id: item.greaterAreaID, state: false })));
    setAreaListOptions(areaOptions.map((item) => ({ area: item.area, id: item.areaID, state: false })));
    setStreetListOptions(streetOptions.map((item) => ({ street: item.street, id: item.streetID, state: false })));
    setRoleListOptions(roleListOptions.map((item) => ({ role: item.role, state: false })));
    setStatusListOptions(statusListOptions.map((item) => ({ status: item.status, state: false })));

    setDeselectStatus("No");
    setDeselectArea("No");
    setDeselectStreet("No");
    setDeselectGreaterArea("No");
    setDeselectPreferredCommunication("No");
    setDeselectRole("No");
    setIsLoading(false);
  };

  //-------------------------------CREATE NEW USER-----------------------------------------

  const handleCreateNewUser = async () => {
    setGreaterAreaOption({ area: "Select one", id: 0 });
    setAreaOption({ area: "Select one", id: 0 });
    setStreetOption({ street: "Select one", id: 0 });
    // setGreaterAreaID(0);
    // setAreaID(0);
    // setStreetID(0);
    setPreferredCommunicationOption("Select one");
    setRoleOption("Select one");
    setStatusOption("Active");
    setStartingDate(new Date());
    setComments("");
    setUserID(0);
    setFirstName("");
    setEmail("");
    setSurname("");
    setPassword("");
    setConfirmPassword("");
    setMobile("");
    setAddressStreetCode("");
    setAddressStreetNumber("");
    setAddressSuburb("");
    setAddressPostalCode("");
    setAddressFreeForm("");
    //isCreate ? setIsCreate(false) : setIsCreate(true);
    setIsCreate(true);
    setIsUpdate(false);
    setIsUpdatePassword(false);
    setPreferredCommunicationListOptions([{ communication: "SMS", state: false }]);
    setDeselectGreaterArea("No");
    setDeselectPreferredCommunication("No");
    setDeselectArea("No");
    setDeselectStreet("No");
    setDeselectRole("No");
    setDeselectStatus("No");
    //set Status to Active
    setStatusListOptions(statusListOptions.map((item) => (item.status === "Active" ? { ...item, state: true } : { ...item, state: false })));
    //setStatusListOptions(statusListOptions.map((item) => ({ status: item.status, state: false })));
    setRoleListOptions(roleListOptions.map((item) => ({ role: item.role, state: false })));
    setStreetListOptions(streetOptions.map((item) => ({ street: item.street, id: item.streetID, state: false })));
    setAreaListOptions(areaOptions.map((item) => ({ area: item.area, id: item.areaID, state: false })));
    setGreaterAreaListOptions(greaterAreaOptions.map((item) => ({ area: item.greaterArea, id: item.greaterAreaID, state: false })));
  };
  //-------------------------------NEW USER-----------------------------------------

  const handleNewUser = async () => {
    setIsLoading(true);
    try {
      const newUser_ = await newUser.mutateAsync({
        firstName: firstName,
        email: email,
        surname: surname,
        password: password,
        mobile: mobile,
        addressGreaterAreaID: greaterAreaOption.area === "Select one" ? 0 : greaterAreaOption.id,
        addressAreaID: areaOption.area === "Select one" ? 0 : areaOption.id,
        addressStreetID: streetOption.street === "Select one" ? 0 : streetOption.id,
        addressStreetCode: addressStreetCode,
        addressStreetNumber: addressStreetNumber,
        addressSuburb: addressSuburb,
        addressPostalCode: addressPostalCode,
        addressFreeForm: addressFreeForm,
        preferredCommunication: preferredOption === "Select one" ? "" : preferredOption,
        startingDate: startingDate,
        role: roleOption === "Select one" ? "" : roleOption,
        status: statusOption === "Select one" ? "" : statusOption,
        comments: comments,
      });

      console.log("This is the new user: " + JSON.stringify(newUser_));
      //Send user details
      //Email
      if (preferredOption === "Email" && sendUserDetails && newUser_?.userID) {
        await sendEmail(firstName, email, String(newUser_.userID), password, "user");
      }

      if (preferredOption === "SMS" && sendUserDetails && newUser_?.userID) {
        const messageContent =
          "Dear " +
          firstName +
          ",\n" +
          "Your AfriPaw Smart App (https://afripaw.app) user ID is: " +
          "U" +
          newUser_?.userID +
          "\n" +
          "Your username is: " +
          newUser_?.userID +
          "\n" +
          "Your password is: " +
          password +
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
      console.log("ID: ", newUser_?.id, "Image: ", newUser_?.image, "Name: ", firstName, "IsUploadModalOpen: ", isUploadModalOpen);

      handleUploadModal(newUser_?.id ?? "", firstName, newUser_?.image ?? "");
      setIsCreate(false);
      setIsUpdate(false);
      setIsUpdatePassword(false);

      //update identification table
      if (newUser_?.userID) {
        await updateIdentification.mutateAsync({
          userID: newUser_?.userID ?? 0,
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
  const handleViewProfilePage = async (id: string) => {
    setIsViewProfilePage(true);
    setID(id);

    const user = user_data?.find((user) => user.id === id);

    //console.log("View profile page: ", JSON.stringify(user.data));
    if (user) {
      // Assuming userQuery.data contains the user object
      const userData = user;
      setUserID(userData.userID ?? 0);
      setFirstName(userData.name ?? "");
      setSurname(userData.surname ?? "");
      setEmail(userData.email ?? "");
      setMobile(userData.mobile ?? "");
      //setGreaterAreaID(userData.addressGreaterAreaID ?? 0);
      //setAreaID(userData.addressAreaID ?? 0);
      //setStreetID(userData.addressStreetID ?? 0);
      setAddressStreetCode(userData.addressStreetCode ?? "");
      setAddressStreetNumber(userData.addressStreetNumber ?? "");
      setAddressSuburb(userData.addressSuburb ?? "");
      setAddressPostalCode(userData.addressPostalCode ?? "");
      setAddressFreeForm(userData.addressFreeForm ?? "");
      setPreferredCommunicationOption(userData.preferredCommunication ?? "");
      setStartingDate(userData.startingDate ?? new Date());
      setRoleOption(userData.role ?? "");
      setStatusOption(userData.status ?? "");
      setComments(userData.comments ?? "");
      setImage(userData.image ?? "");
      console.log("Image: ", userData.image);
      console.log("Image: ", image);

      const greaterArea: GreaterArea = { area: userData.addressGreaterArea.greaterArea ?? "", id: userData.addressGreaterAreaID ?? 0 };

      setGreaterAreaOption(greaterArea);

      const greaterAreas = greaterAreaOptions.map((item) => ({
        area: item.greaterArea,
        id: item.greaterAreaID,
        state: item.greaterArea === userData.addressGreaterArea.greaterArea ? true : false,
      }));
      setGreaterAreaListOptions(greaterAreas);

      const area: Area = { area: userData.addressArea?.area ?? "", id: userData.addressAreaID ?? 0 };

      setAreaOption(area);

      const areas = areaOptions.map((item) => ({
        area: item.area,
        id: item.areaID,
        state: item.area === userData.addressArea?.area ? true : false,
      }));
      setAreaListOptions(areas);

      const street: Street = { street: userData.addressStreet?.street ?? "", id: userData.addressStreetID ?? 0 };

      setStreetOption(street);

      const streets = streetOptions.map((item) => ({
        street: item.street,
        id: item.streetID,
        state: item.street === userData.addressStreet?.street ? true : false,
      }));
      setStreetListOptions(streets);

      if (userData.email === "") {
        setPreferredCommunicationListOptions([{ communication: "SMS", state: userData.preferredCommunication === "SMS" ? true : false }]);
      } else if (userData.email != "") {
        setPreferredCommunicationListOptions([
          { communication: "Email", state: userData.preferredCommunication === "Email" ? true : false },
          { communication: "SMS", state: userData.preferredCommunication === "SMS" ? true : false },
        ]);
      }

      setRoleListOptions(roleListOptions.map((item) => (item.role === userData.role ? { ...item, state: true } : { ...item, state: false })));

      setStatusListOptions(statusListOptions.map((item) => (item.status === userData.status ? { ...item, state: true } : { ...item, state: false })));
      // setPreferredCommunicationListOptions(
      //   preferredCommunicationListOptions.map((item) => (item.communication === userData.preferredCommunication ? { ...item, state: "Yes" } : { ...item, state: "No" })),
      // );

      //Make sure thet area and street options have a value
      // if (userData.addressAreaID === 0 || userData.addressAreaID === undefined) {
      //   setAreaOption({ area: "", id: 0 });
      // }
      // if (userData.addressStreetID === 0 || userData.addressStreetID === undefined) {
      //   setStreetOption({ street: "", id: 0 });
      // }
      if (areaOption.area == "Select one" || areaOption.area == "" || areaOption.area == undefined || areaOption.id == 0) {
        setAreaOption({ area: "", id: 0 });
      }
      if (streetOption.street == "Select one" || streetOption.street == "" || streetOption.street == undefined || streetOption.id == 0) {
        setStreetOption({ street: "", id: 0 });
      }
    }

    setIsUpdate(false);
    setIsCreate(false);
    setIsViewProfilePage(true);
  };

  useEffect(() => {
    //console.log("View profile page: ", JSON.stringify(user.data));
    if (user) {
      const userData = user;
      setUserID(userData.userID ?? 0);
      setFirstName(userData.name ?? "");
      setSurname(userData.surname ?? "");
      setEmail(userData.email ?? "");
      setMobile(userData.mobile ?? "");
      //setGreaterAreaID(userData.addressGreaterAreaID ?? 0);
      //setAreaID(userData.addressAreaID ?? 0);
      //setStreetID(userData.addressStreetID ?? 0);
      setAddressStreetCode(userData.addressStreetCode ?? "");
      setAddressStreetNumber(userData.addressStreetNumber ?? "");
      setAddressSuburb(userData.addressSuburb ?? "");
      setAddressPostalCode(userData.addressPostalCode ?? "");
      setAddressFreeForm(userData.addressFreeForm ?? "");
      setPreferredCommunicationOption(userData.preferredCommunication ?? "");
      setStartingDate(userData.startingDate ?? new Date());
      setRoleOption(userData.role ?? "");
      setStatusOption(userData.status ?? "");
      setComments(userData.comments ?? "");
      setImage(userData.image ?? "");
      console.log("Image: ", userData.image);
      console.log("Image: ", image);

      // setPreferredCommunicationListOptions(
      //   preferredCommunicationListOptions.map((item) => (item.communication === userData.preferredCommunication ? { ...item, state: "Yes" } : { ...item, state: "No" })),
      // );

      if (userData.email === "") {
        setPreferredCommunicationListOptions([{ communication: "SMS", state: userData.preferredCommunication === "SMS" ? true : false }]);
      } else if (userData.email != "") {
        setPreferredCommunicationListOptions([
          { communication: "Email", state: userData.preferredCommunication === "Email" ? true : false },
          { communication: "SMS", state: userData.preferredCommunication === "SMS" ? true : false },
        ]);
      }

      setRoleListOptions(roleListOptions.map((item) => (item.role === userData.role ? { ...item, state: true } : { ...item, state: false })));

      setStatusListOptions(statusListOptions.map((item) => (item.status === userData.status ? { ...item, state: true } : { ...item, state: false })));
      if (isUpdate) {
        const greaterArea: GreaterArea = { area: userData.addressGreaterArea.greaterArea ?? "Select one", id: userData.addressGreaterAreaID ?? 0 };

        setGreaterAreaOption(greaterArea);

        const greaterAreas = greaterAreaOptions.map((item) => ({
          area: item.greaterArea,
          id: item.greaterAreaID,
          state: item.greaterArea === userData.addressGreaterArea.greaterArea ? true : false,
        }));
        setGreaterAreaListOptions(greaterAreas);

        const area: Area = { area: userData.addressArea?.area ?? "Select one", id: userData.addressAreaID ?? 0 };

        setAreaOption(area);

        const areas = areaOptions.map((item) => ({
          area: item.area,
          id: item.areaID,
          state: item.area === userData.addressArea?.area ? true : false,
        }));
        setAreaListOptions(areas);

        const street: Street = { street: userData.addressStreet?.street ?? "Select one", id: userData.addressStreetID ?? 0 };

        setStreetOption(street);

        const streets = streetOptions.map((item) => ({
          street: item.street,
          id: item.streetID,
          state: item.street === userData.addressStreet?.street ? true : false,
        }));
        setStreetListOptions(streets);
      }
      if (isViewProfilePage) {
        const greaterArea: GreaterArea = { area: userData.addressGreaterArea.greaterArea ?? "", id: userData.addressGreaterAreaID ?? 0 };

        setGreaterAreaOption(greaterArea);

        const greaterAreas = greaterAreaOptions.map((item) => ({
          area: item.greaterArea,
          id: item.greaterAreaID,
          state: item.greaterArea === userData.addressGreaterArea.greaterArea ? true : false,
        }));
        setGreaterAreaListOptions(greaterAreas);

        const area: Area = { area: userData.addressArea?.area ?? "", id: userData.addressAreaID ?? 0 };

        setAreaOption(area);

        const areas = areaOptions.map((item) => ({
          area: item.area,
          id: item.areaID,
          state: item.area === userData.addressArea?.area ? true : false,
        }));
        setAreaListOptions(areas);

        const street: Street = { street: userData.addressStreet?.street ?? "", id: userData.addressStreetID ?? 0 };

        setStreetOption(street);

        const streets = streetOptions.map((item) => ({
          street: item.street,
          id: item.streetID,
          state: item.street === userData.addressStreet?.street ? true : false,
        }));
        setStreetListOptions(streets);
      }

      //console.log("Select one");
      //Make sure thet area and street options have a value
      // if ((userData.addressAreaID === 0 || userData.addressAreaID === undefined) && !isUpdate) {
      //   setAreaOption({ area: "", id: 0 });
      // }
      // if (userData.addressStreetID === 0 || (userData.addressAreaID === undefined && !isUpdate)) {
      //   setStreetOption({ street: "", id: 0 });
      // }
      // if (userData.addressAreaID === 0 || (userData.addressAreaID === undefined && isUpdate)) {
      //   setAreaOption({ area: "Select one", id: 0 });
      // }
      // if (userData.addressStreetID === 0 || (userData.addressAreaID === undefined && isUpdate)) {
      //   setStreetOption({ street: "Select one", id: 0 });
      // }

      if (areaOption.area === "Select one" && isViewProfilePage) {
        setAreaOption({ area: "", id: 0 });
      }
      if (streetOption.street === "Select one" && isViewProfilePage) {
        setStreetOption({ street: "", id: 0 });
      }
    }
  }, [isViewProfilePage, isCreate, isUpdate]); // Effect runs when userQuery.data changes

  //Retrieve image from the database
  const handleImage = async (id: string) => {
    setIsDoneUploading(true);
    const user = user_data?.find((user) => user.id === id);
    if (user) {
      // Assuming userQuery.data contains the user object
      const userData = user;
      setImage(userData.image ?? "");
      if (user.image) {
        setIsDoneUploading(false);
      }
    }
  };

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
    setIsUpdatePassword(false);
    setIsUploadModalOpen(false);
    setID("");
    setUserID(0);
    setFirstName("");
    setEmail("");
    setSurname("");
    setPassword("");
    setConfirmPassword("");
    setMobile("");
    setGreaterAreaOption({ area: "Select one", id: 0 });
    setAreaOption({ area: "Select one", id: 0 });
    setStreetOption({ street: "Select one", id: 0 });
    setAddressStreetCode("");
    setAddressStreetNumber("");
    setAddressSuburb("");
    setAddressPostalCode("");
    setPreferredCommunicationOption("Select one");
    setRoleOption("Select one");
    setStatusOption("Select one");
    setComments("");
    setImage("");
    setPreferredCommunicationListOptions([{ communication: "SMS", state: false }]);
    setGreaterAreaListOptions(greaterAreaOptions.map((item) => ({ area: item.greaterArea, id: item.greaterAreaID, state: false })));
    setAreaListOptions(areaOptions.map((item) => ({ area: item.area, id: item.areaID, state: false })));
    setStreetListOptions(streetOptions.map((item) => ({ street: item.street, id: item.streetID, state: false })));
    setRoleListOptions(roleListOptions.map((item) => ({ role: item.role, state: false })));
    setStatusListOptions(statusListOptions.map((item) => ({ status: item.status, state: false })));

    setDeselectStatus("No");
    setDeselectGreaterArea("No");
    setDeselectPreferredCommunication("No");
    setDeselectArea("No");
    setDeselectStreet("No");
    setDeselectRole("No");
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
  //Should allow only letters
  const [streetCodeMessage, setStreetCodeMessage] = useState("");
  useEffect(() => {
    if (addressStreetCode.match(/^[A-Za-z]+$/) == null && addressStreetCode.length != 0) {
      setStreetCodeMessage("Street code must only contain letters");
    } else if (addressStreetCode.length > 4 && addressStreetCode.length != 0) {
      setStreetCodeMessage("Street code must be 4 characters or less");
    } else {
      setStreetCodeMessage("");
    }
  }, [addressStreetCode]);

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

  //Password
  const [passwordMessage, setPasswordMessage] = useState("");
  const [confirmPasswordMessage, setConfirmPasswordMessage] = useState("");
  useEffect(() => {
    if (password.length < 8 && password.length != 0) {
      setPasswordMessage("Password must be at least 8 characters long");
    }
    //check if password is strong enough. Should contain Upper case, lower case, number and special character
    else if (password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\{\}:"<>?|\[\];',.\/`~])/) == null && password.length != 0) {
      setPasswordMessage("Password must contain at least one upper case, one lower case, one number and one special character");
    }

    //!@#$%^&*()_+{}:\"<>?|[];',./`~
    //check if both passwords match
    else if (password != confirmPassword && confirmPassword.length != 0) {
      setConfirmPasswordMessage("Passwords must match");
    } else if (password.length > 20 && password.length != 0) {
      setPasswordMessage("Password must be less than 20 characters long");
    } else {
      setPasswordMessage("");
      setConfirmPasswordMessage("");
    }
  }, [password, confirmPassword]);

  //Clear password fields when update password is unchecked
  useEffect(() => {
    if (!isUpdatePassword) {
      setPassword("");
      setConfirmPassword("");
    }
  }, [isUpdatePassword]);

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
    if (greaterAreaOption.area === "Select one") mandatoryFields.push("Greater Area");
    if (preferredOption === "Select one") mandatoryFields.push("Preferred Communication");
    if (roleOption === "Select one") mandatoryFields.push("Role");
    if (statusOption === "Select one") mandatoryFields.push("Status");
    if (startingDate === null) mandatoryFields.push("Starting Date");
    if (password === "" && !isUpdate) mandatoryFields.push("Password");
    if (confirmPassword === "" && !isUpdate) mandatoryFields.push("Confirm Password");
    if (preferredOption === "Email" && email === "") mandatoryFields.push("Email is preferred communication but is empty");

    if (mobileMessage !== "") errorFields.push({ field: "Mobile", message: mobileMessage });
    //if (streetCodeMessage !== "") errorFields.push({ field: "Street Code", message: streetCodeMessage });
    if (streetNumberMessage !== "") errorFields.push({ field: "Street Number", message: streetNumberMessage });
    if (streetCodeMessage !== "") errorFields.push({ field: "Street Code", message: streetCodeMessage });
    if (postalCodeMessage !== "") errorFields.push({ field: "Postal Code", message: postalCodeMessage });
    if (passwordMessage !== "") errorFields.push({ field: "Password", message: passwordMessage });
    if (confirmPasswordMessage !== "") errorFields.push({ field: "Confirm Password", message: confirmPasswordMessage });

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
  const [deleteUserID, setDeleteUserID] = useState("");
  const handleDeleteModal = (id: string, userID: string, name: string) => {
    setDeleteUserID(id);
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
  const handleUploadModal = (userID: string, name: string, image: string) => {
    setIsUploadModalOpen(true);
    console.log("UserID: " + userID + " Name: " + name + " Image: " + image + "IsUploadModalOpen: " + isUploadModalOpen);
    //setIsCreate(true);
    setUploadUserID(userID);
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

  //----------------------------------ORDER FIELDS----------------------------------
  const handleOrderFields = (field: string) => {
    setOrder(field);
  };

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
      {isUpdate ? startingDate?.getDate().toString() + "/" + (startingDate.getMonth() + 1).toString() + "/" + startingDate.getFullYear().toString() : value}
    </button>
  );

  // ----------------------------------------Uploading Image----------------------------------------
  useEffect(() => {
    if (user?.image != "" && isDoneUploading) {
      setIsDoneUploading(false);
    }
  }, [user, isCreate, isUpdate, isViewProfilePage]);

  //------------------------------------------DOWNLOADING USER TABLE TO EXCEL FILE------------------------------------------
  const downloadUserTable = api.user.download.useQuery({ searchQuery: query });
  const handleDownloadUserTable = async () => {
    setIsLoading(true);
    //take the download user table query data and put it in an excel file
    const data = downloadUserTable.data;
    const fileName = "User Table";
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
        <title>User Profiles</title>
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
              <ImageUploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                userID={uploadUserID}
                userType={"user"}
                userName={uploadUserName}
                userImage={uploadUserImage}
              />
              <div className="sticky top-20 z-10 bg-white py-4">
                <div className="relative flex justify-center">
                  <button
                    className="absolute left-0 top-0 mx-3 mb-3 rounded-lg bg-main-orange p-3 text-white hover:bg-orange-500"
                    onClick={handleDownloadUserTable}
                  >
                    {isLoading ? (
                      <div
                        className="mx-2 inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-current border-white border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
                        role="status"
                      />
                    ) : (
                      <div>Download User Table</div>
                    )}
                  </button>
                  <input
                    className="mt-4 flex w-1/3 rounded-lg border-2 border-zinc-800 px-2"
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
                    Create new User
                  </button>
                  {/* <button
                    className="absolute left-0 top-0 mx-3 mb-3 rounded-lg bg-main-orange p-3 text-white hover:bg-orange-500"
                    onClick={() => void handleCreateIdentification(1000004, 1000026, 1000021, 1000030, 10000019, 1000026, 1000001, 11)}
                  >
                    Create identification record
                  </button> */}

                  {/* <button
                    className="absolute left-0 top-0 mx-3 mb-3 rounded-lg bg-main-orange p-3 hover:bg-orange-500"
                    onClick={handleDeleteAllIdentifications}
                  >
                    Delete all identification
                  </button> */}

                  {/* <button className="absolute left-0 top-0 mx-3 mb-3 rounded-lg bg-main-orange p-3 hover:bg-orange-500" onClick={handleDeleteAllUsers}>
                    Delete all users
                  </button> */}
                </div>
              </div>
              {user_data ? (
                // <article className="my-5 flex max-h-[60%] w-full flex-col items-center justify-center overflow-auto rounded-md shadow-inner">
                //   <table className="">
                //     {/* table-auto scroll-smooth */}
                //     <thead className=" z-20">
                //       <tr>
                //         <th className="px-4 py-2"></th>
                //         {/* <th className="px-4 py-2">ID</th> */}
                //         <th className="px-4 py-2">Name</th>

                <article className="my-5 flex w-full justify-center rounded-md shadow-inner">
                  <div className="max-h-[70vh] max-w-7xl overflow-auto">
                    {/* max-h-[60vh] */}
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="z-30 bg-gray-50">
                        <tr className="">
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2"></th>
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
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Area</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Role</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Status</th>
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
                        {user_data?.map((user, index) => {
                          return (
                            <tr className="items-center">
                              <td className=" border px-2 py-1">
                                <div className="flex justify-center">{index + 1}</div>
                              </td>
                              {/* <td className="border px-4 py-2">U{user.userID}</td> */}
                              <td className="border px-2 py-1">{user.name}</td>
                              <td className="border px-2 py-1">{user.surname}</td>
                              <td className="border px-2 py-1">{user.email}</td>
                              <td className="border px-2 py-1">{user.mobile}</td>
                              <td className="border px-2 py-1">{user.addressGreaterArea.greaterArea}</td>
                              <td className="border px-2 py-1">{user.addressArea?.area}</td>
                              <td className="border px-2 py-1">{user.role}</td>
                              <td className="border px-2 py-1">{user.status}</td>

                              <td className=" border px-2 py-1">
                                {user?.updatedAt?.getDate()?.toString() ?? ""}
                                {"/"}
                                {((user?.updatedAt?.getMonth() ?? 0) + 1)?.toString() ?? ""}
                                {"/"}
                                {user?.updatedAt?.getFullYear()?.toString() ?? ""}
                              </td>
                              <div className="flex">
                                {/* <div className="group relative flex items-center justify-center">
                              <span className="absolute bottom-full hidden rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 shadow-sm group-hover:block">
                                Deletes user
                              </span>
                              <Trash
                                size={24}
                                className="group relative mx-2 my-3 flex items-center justify-center rounded-lg hover:bg-orange-200"
                                onClick={() => handleDeleteModal(user.id, String(user.userID), user.name ?? "")}
                              />
                            </div> */}
                                <div className="relative flex items-center justify-center">
                                  <span className="group relative mx-[5px] my-3 flex items-center justify-center rounded-lg hover:bg-orange-200">
                                    <Trash size={24} className="block" onClick={() => handleDeleteModal(user.id, String(user.userID), user.name ?? "")} />
                                    <span className="absolute bottom-full hidden rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 shadow-sm group-hover:block">
                                      Delete user
                                    </span>
                                  </span>
                                </div>

                                <div className="relative flex items-center justify-center">
                                  <span className="group relative mx-[5px] my-3 flex items-center justify-center rounded-lg hover:bg-orange-200">
                                    <Pencil size={24} className="block" onClick={() => handleUpdateUserProfile(String(user.id))} />
                                    <span className="absolute bottom-full hidden rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 shadow-sm group-hover:block">
                                      Update user
                                    </span>
                                  </span>
                                </div>

                                <div className="relative flex items-center justify-center">
                                  <span className="group relative mx-[5px] my-3 flex items-center justify-center rounded-lg hover:bg-orange-200">
                                    <AddressBook size={24} className="block" onClick={() => handleViewProfilePage(String(user.id))} />
                                    <span className="absolute bottom-full hidden w-[75px] rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 shadow-sm group-hover:block">
                                      View user profile
                                    </span>
                                  </span>
                                </div>
                              </div>
                            </tr>
                          );
                        })}
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

              <div ref={observerTarget} />
            </div>
          </>
        )}
        {(isCreate || isUpdate) && (
          <>
            <div className="flex justify-center">
              <div className="relative mb-4 flex grow flex-col items-center rounded-lg bg-slate-200 px-5 py-6">
                <b className=" text-2xl">{isUpdate ? "Update User Data" : "Create New User"}</b>
                <div className="flex justify-center">
                  <button className="absolute right-0 top-0 m-3 rounded-lg bg-main-orange p-3 text-white hover:bg-orange-500" onClick={handleBackButton}>
                    Back To User Table
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
                {"("}All fields with <span className="px-1 text-lg text-main-orange">*</span> are compulsary{")"}
              </label>
              <div className="flex flex-col">
                <div className="relative my-2 flex w-full flex-col rounded-lg border-2 bg-slate-200 p-4">
                  <b className="mb-3 text-center text-xl">Personal & Contact Data</b>
                  {isUpdate && (
                    <div className={`absolute ${user?.image ? "right-12" : "right-8"} top-16`}>
                      {user?.image ? (
                        <Image
                          src={image ? image : user?.image}
                          alt="Afripaw profile pic"
                          className="ml-auto aspect-auto max-h-40 max-w-[7rem]"
                          width={140}
                          height={100}
                        />
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
                      input={{ userId: user?.id ?? "", user: "user" }}
                      onUploadError={(error: Error) => {
                        // Do something with the error.
                        alert(`ERROR! ${error.message}`);
                      }}
                      onClientUploadComplete={() => {
                        //retrieve the image from the server
                        setIsDoneUploading(true);
                        void handleImage(user?.id ?? "");

                        //void user.refetch();
                      }}
                    />
                  )}
                  <div className="flex py-2">
                    User ID: <div className="px-3">U{isCreate ? String((latestUserID?.data?.userID ?? 0) + 1) : userID}</div>
                  </div>
                  <Input label="First Name" placeholder="Type here: e.g. John" value={firstName} onChange={setFirstName} required />
                  <Input label="Surname" placeholder="Type here: e.g. Doe" value={surname} onChange={setSurname} required />
                  <Input label="Email" placeholder="Type here: e.g. jd@gmail.com" value={email} onChange={setEmail} />
                  <Input label="Mobile" placeholder="Type here: e.g. 0821234567" value={mobile} onChange={setMobile} required />
                  {mobileMessage && <div className="text-sm text-red-500">{mobileMessage}</div>}

                  <div className="flex items-start">
                    <div className="mr-3 flex items-center pt-4">
                      <label>
                        Preferred Communication Channel<span className="text-lg text-main-orange">*</span>:{" "}
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

                          {/* <ul className="flex flex-col items-start px-2 py-2 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdownHoverButton">
                            <li key="0">
                              <label className="flex">
                                <input
                                  type="radio"
                                  name="preferredCommunication"
                                  checked={deselectPreferredCommunication === "Yes"}
                                  className="mr-1 checked:bg-main-orange"
                                  onChange={() => handlePreferredCommunication("", "Yes")}
                                />
                                Deselect
                              </label>
                            </li>
                            {preferredCommunicationListOptions.map((option) => (
                              <li key={option.communication} className=" py-2">
                                <label className="flex justify-center">
                                  <input
                                    type="radio"
                                    name="preferredCommunication"
                                    checked={option.state}
                                    className="mr-1 checked:bg-main-orange"
                                    onChange={() => handlePreferredCommunication(option.communication, "No")}
                                  />
                                  {option.communication}
                                </label>
                              </li>
                            ))}
                          </ul> */}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="my-2 flex w-full flex-col rounded-lg border-2 bg-slate-200 p-4">
                  <b className="mb-3 text-center text-xl">Geographical & Location Data</b>
                  <div className="flex flex-col divide-y-2 divide-gray-300">
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
                                  <button className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">
                                    {option.greaterArea}
                                  </button>
                                </li>
                              ))}
                            </ul>

                            {/* <ul className="flex flex-col items-start px-2 py-2 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdownHoverButton">
                              <li key="0">
                                <label className="flex">
                                  <input
                                    type="radio"
                                    name="greaterArea"
                                    checked={deselectGreaterArea === "Yes"}
                                    className="mr-1 checked:bg-main-orange"
                                    onChange={() => handleGreaterArea(0, "", "Yes")}
                                  />
                                  Deselect
                                </label>
                              </li>
                              {greaterAreaListOptions.map((option) => (
                                <li key={option.id} className=" py-2">
                                  <label className="flex justify-center">
                                    <input
                                      type="radio"
                                      name="greaterArea"
                                      checked={option.state}
                                      className="mr-1 checked:bg-main-orange"
                                      onChange={() => handleGreaterArea(option.id, option.area, "No")}
                                    />
                                    {option.area}
                                  </label>
                                </li>
                              ))}
                            </ul> */}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start divide-x-2 divide-gray-300">
                      <div className="flex flex-col pr-2">
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
                              {areaOption.area + " "}
                              <svg className="ms-3 h-2.5 w-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                              </svg>
                            </button>
                            {isAreaOpen && (
                              <div ref={areaRef} className="z-10 w-44 divide-y divide-gray-100 rounded-lg bg-white shadow dark:bg-gray-700">
                                {/* <ul className="py-2 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdownHoverButton">
                                  {areaOptions.map((option) => (
                                    <li key={option.areaID} onClick={() => handleAreaOption(option.area, option.areaID)}>
                                      <button className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">{option.area}</button>
                                    </li>
                                  ))}
                                </ul> */}
                                <ul
                                  className="flex flex-col items-start px-2 py-2 text-sm text-gray-700 dark:text-gray-200"
                                  aria-labelledby="dropdownHoverButton"
                                >
                                  <li key="0">
                                    <label className="flex">
                                      <input
                                        type="radio"
                                        name="area"
                                        checked={deselectArea === "Yes"}
                                        className="mr-1 checked:bg-main-orange"
                                        onChange={() => handleArea(0, "", "Yes")}
                                      />
                                      Deselect
                                    </label>
                                  </li>
                                  {areaListOptions.map((option) => (
                                    <li key={option.id} className=" py-2">
                                      <label className="flex justify-center">
                                        <input
                                          type="radio"
                                          name="area"
                                          checked={option.state}
                                          className="mr-1 checked:bg-main-orange"
                                          onChange={() => handleArea(option.id, option.area, "No")}
                                        />
                                        {option.area}
                                      </label>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-start">
                          <div className="mr-3 flex items-center pt-5">
                            <div className=" flex">Street: </div>
                          </div>
                          <div className="flex flex-col">
                            <button
                              ref={btnStreetRef}
                              className="my-3 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                              type="button"
                              onClick={handleToggleStreet}
                            >
                              {streetOption.street + " "}
                              <svg className="ms-3 h-2.5 w-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                              </svg>
                            </button>
                            {isStreetOpen && (
                              <div ref={streetRef} className="z-10 w-44 divide-y divide-gray-100 rounded-lg bg-white shadow dark:bg-gray-700">
                                {/* <ul className="py-2 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdownHoverButton">
                                  {streetOptions.map((option) => (
                                    <li key={option.streetID} onClick={() => handleStreetOption(option.street, option.streetID)}>
                                      <button className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">
                                        {option.street}
                                      </button>
                                    </li>
                                  ))}
                                </ul> */}
                                <ul
                                  className="flex flex-col items-start px-2 py-2 text-sm text-gray-700 dark:text-gray-200"
                                  aria-labelledby="dropdownHoverButton"
                                >
                                  <li key="0">
                                    <label className="flex">
                                      <input
                                        type="radio"
                                        name="street"
                                        checked={deselectStreet === "Yes"}
                                        className="mr-1 checked:bg-main-orange"
                                        onChange={() => handleStreet(0, "", "Yes")}
                                      />
                                      Deselect
                                    </label>
                                  </li>
                                  {streetListOptions.map((option) => (
                                    <li key={option.id} className=" py-2">
                                      <label className="flex justify-center">
                                        <input
                                          type="radio"
                                          name="street"
                                          checked={option.state}
                                          className="mr-1 checked:bg-main-orange"
                                          onChange={() => handleStreet(option.id, option.street, "No")}
                                        />
                                        {option.street}
                                      </label>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>

                        <Input label="Street Code" placeholder="Type here: e.g. OH" value={addressStreetCode} onChange={setAddressStreetCode} />
                        {streetCodeMessage && <div className="text-sm text-red-500">{streetCodeMessage}</div>}

                        <div className="flex items-center">
                          <div className="">Street Number: </div>
                          <input
                            className="m-2 rounded-lg border-2 border-slate-300 px-2 focus:border-black"
                            placeholder="Type here: e.g. 14"
                            onChange={(e) => setAddressStreetNumber(e.target.value)}
                            value={addressStreetNumber}
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
                      <label>
                        Role<span className="text-lg text-main-orange">*</span>:{" "}
                      </label>
                    </div>
                    <div className="flex flex-col">
                      <button
                        ref={btnRoleRef}
                        className="my-3 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                        type="button"
                        onClick={handleToggleRole}
                      >
                        {roleOption + " "}
                        <svg className="ms-3 h-2.5 w-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                        </svg>
                      </button>
                      {role && (
                        <div ref={roleRef} className="z-10 w-44 divide-y divide-gray-100 rounded-lg bg-white shadow dark:bg-gray-700">
                          <ul className="py-2 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdownHoverButton">
                            {roleOptions.map((option) => (
                              <li key={option} onClick={() => handleRoleOption(option)}>
                                <button className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">{option}</button>
                              </li>
                            ))}
                          </ul>

                          {/* <ul className="flex flex-col items-start px-2 py-2 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdownHoverButton">
                            <li key="0">
                              <label className="flex">
                                <input
                                  type="radio"
                                  name="role"
                                  checked={deselectRole === "Yes"}
                                  className="mr-1 checked:bg-main-orange"
                                  onChange={() => handleRole("", "Yes")}
                                />
                                Deselect
                              </label>
                            </li>
                            {roleListOptions.map((option) => (
                              <li key={option.role} className=" py-2">
                                <label className="flex justify-center">
                                  <input
                                    type="radio"
                                    name="role"
                                    checked={option.state}
                                    className="mr-1 checked:bg-main-orange"
                                    onChange={() => handleRole(option.role, "No")}
                                  />
                                  {option.role}
                                </label>
                              </li>
                            ))}
                          </ul> */}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="mr-3 flex items-center pt-4">
                      <label>
                        Status<span className="text-lg text-main-orange">*</span>:{" "}
                      </label>
                    </div>
                    <div className="flex flex-col">
                      <button
                        ref={btnStatusRef}
                        className="my-3 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
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
                                <button className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">{option}</button>
                              </li>
                            ))}
                          </ul>

                          {/* <ul className="flex flex-col items-start px-2 py-2 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdownHoverButton">
                            <li key="0">
                              <label className="flex">
                                <input
                                  type="radio"
                                  name="status"
                                  checked={deselectStatus === "Yes"}
                                  className="mr-1 checked:bg-main-orange"
                                  onChange={() => handleStatus("", "Yes")}
                                />
                                Deselect
                              </label>
                            </li>
                            {statusListOptions.map((option) => (
                              <li key={option.status} className=" py-2">
                                <label className="flex justify-center">
                                  <input
                                    type="radio"
                                    name="status"
                                    checked={option.state}
                                    className="mr-1 checked:bg-main-orange"
                                    onChange={() => handleStatus(option.status, "No")}
                                  />
                                  {option.status}
                                </label>
                              </li>
                            ))}
                          </ul> */}
                        </div>
                      )}
                    </div>
                  </div>

                  {/*DATEPICKER*/}
                  <div className="flex items-center">
                    <label>
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
                    <div className="w-32 pt-3">Comments: </div>
                    <textarea
                      className="m-2 h-24 w-full rounded-lg border-2 border-slate-300 px-2 focus:border-black"
                      placeholder="Type here: e.g. Notes on commitment, engagement, etc."
                      onChange={(e) => setComments(e.target.value)}
                      value={comments}
                    />
                  </div>

                  {isUpdate && (
                    <div className="flex justify-center">
                      <button
                        className="my-4 rounded-md bg-main-orange px-8 py-3 text-white hover:bg-orange-500"
                        onClick={() => void setIsUpdatePassword(!isUpdatePassword)}
                      >
                        {isUpdatePassword ? "Change Password" : "Cancel Password Change"}
                      </button>
                    </div>
                  )}
                  {!isUpdatePassword && (
                    <div className="flex items-center">
                      <label className="mr-3">
                        Password<span className="text-lg text-main-orange">*</span>:{" "}
                      </label>
                      <input
                        className="m-2 rounded-lg border-2 border-slate-300 px-2 focus:border-black"
                        placeholder="Type here: e.g. JohnDoe$123"
                        onChange={(e) => setPassword(e.target.value)}
                        value={password}
                      />
                      <button onClick={handleAutogeneratePassword} className="mx-3 rounded-lg bg-main-orange p-1 px-2 text-white">
                        Auto Suggest Password
                      </button>
                    </div>
                  )}
                  {passwordMessage && <div className="text-sm text-red-500">{passwordMessage}</div>}
                  {!isUpdatePassword && (
                    <div className="flex items-center">
                      <label className="mr-3">
                        Confirm Password<span className="text-lg text-main-orange">*</span>:{" "}
                      </label>
                      <input
                        className="m-2 rounded-lg border-2 border-slate-300 px-2 focus:border-black"
                        placeholder="Type here: e.g. JohnDoe$123"
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        value={confirmPassword}
                      />
                    </div>
                  )}
                  {confirmPasswordMessage && <div className="text-sm text-red-500">{confirmPasswordMessage}</div>}

                  <div className="flex items-center">
                    <input
                      id="checked-checkbox"
                      type="checkbox"
                      onChange={(e) => setSendUserDetails(e.target.checked)}
                      className="h-4 w-4 rounded bg-gray-100 text-main-orange accent-main-orange focus:ring-2"
                    />
                    <label htmlFor="checked-checkbox" className="ms-2 text-sm font-medium text-gray-900">
                      Send login credentials via preferred communication channel
                    </label>
                  </div>
                </div>
              </div>
              <button
                className="my-4 flex items-center rounded-md bg-main-orange px-8 py-3 text-lg text-white hover:bg-orange-500"
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
                <div className=" text-2xl">User Profile</div>
                <div className="flex justify-center">
                  <button className="absolute right-0 top-0 m-3 rounded-lg bg-main-orange p-3 text-white hover:bg-orange-500" onClick={handleBackButton}>
                    Back To User Table
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
                  <div className="absolute right-4 top-20">
                    {user?.image ?? image ? (
                      <Image
                        src={image ?? user?.image ?? ""}
                        alt="Afripaw profile pic"
                        className="ml-auto aspect-auto max-h-52 max-w-[9rem]"
                        width={150}
                        height={150}
                      />
                    ) : (
                      <UserCircle size={140} className="ml-auto aspect-auto max-h-52 max-w-[9rem]" />
                    )}
                  </div>
                  <b className="mb-14 text-center text-xl">Personal & Contact Data</b>
                  <div className="mb-2 flex items-center">
                    <b className="mr-3">User ID:</b> U{userID}
                  </div>

                  <div className="mb-2 flex items-center">
                    <b className="mr-3">Name:</b> {firstName}
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
                    <b className="mr-3">Preferred Communication Channel:</b> {preferredOption}
                  </div>
                </div>

                <div className="my-2 flex w-full flex-col rounded-lg border-2 bg-slate-200 p-4">
                  <b className="mb-3 text-center text-xl">Geographical & Location Data</b>
                  <div className="mb-2 flex items-center">
                    <b className="mr-3">Greater Area:</b> {greaterAreaOption.area}
                  </div>
                  <div className="flex items-start divide-x-2 divide-gray-300">
                    <div className="flex w-96 flex-col pr-2">
                      <div className="mb-2 flex items-center">
                        <b className="mr-3">Area:</b> {areaOption.area}
                      </div>

                      <div className="mb-2 flex items-center">
                        <b className="mr-3">Street:</b> {streetOption.street}
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
                    <b className="mr-3">Role:</b> {roleOption}
                  </div>

                  <div className="mb-2 flex items-center">
                    <b className="mr-3">Status:</b> {statusOption}
                  </div>

                  <div className="mb-2 flex items-center">
                    <b className="mr-3">Starting Date:</b> {startingDate?.getDate() + "/" + (startingDate?.getMonth() + 1) + "/" + startingDate?.getFullYear()}
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

export default User;
