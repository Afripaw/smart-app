import { type NextPage } from "next";
import Head from "next/head";
import React, { SetStateAction, useEffect, useRef, useState } from "react";
import { api } from "~/utils/api";
import { useRouter } from "next/router";
import Navbar from "../components/navbar";
import { Pencil, Trash } from "phosphor-react";

//---------------------------------------------DATEPICKER---------------------------------------------
// TW Elements is free under AGPL, with commercial license required for specific uses. See more details: https://tw-elements.com/license/ and contact us for queries at tailwind@mdbootstrap.com
// Initialization for ES Users
//import { Datepicker, Input, initTE } from "tw-elements";

//initTE({ Datepicker, Input });
import DatePicker, { ReactDatePickerProps } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import CreateButtonModal from "../components/createButtonModal";
import { date } from "zod";
import DeleteButtonModal from "~/components/deleteButtonModal";
import { set } from "date-fns";
import { start } from "repl";

const User: NextPage = () => {
  const router = useRouter();
  const newUser = api.user.create.useMutation();
  const updateUser = api.user.update.useMutation();
  //const [user, setUser] = useState<{ id: string } | null>(null);
  const [isUpdate, setIsUpdate] = useState(false);
  const [isCreate, setIsCreate] = useState(false);
  //Update the table when user is deleted
  const [isDeleted, setIsDeleted] = useState(false);
  // const userTable = api.user.getAllUsers.useQuery();

  //-------------------------------SEARCH BAR------------------------------------
  //Query the users table
  const [query, setQuery] = useState("");

  //-------------------------------TABLE-----------------------------------------
  const data = api.user.searchUsers.useQuery({ searchQuery: query });
  //delete specific row
  const deleteRow = api.user.deleteUser.useMutation();
  const handleDeleteRow = async (id: string) => {
    setIsDeleteModalOpen(false);
    await deleteRow.mutateAsync({ userID: id });
    isDeleted ? setIsDeleted(false) : setIsDeleted(true);
  };
  //autoload the table
  useEffect(() => {
    void data.refetch();
  }, [isUpdate, isDeleted, isCreate]);

  //---------------------------------EDIT BOXES----------------------------------
  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [addressStreet, setAddressStreet] = useState("");
  const [addressStreetCode, setAddressStreetCode] = useState("");
  const [addressStreetNumber, setAddressStreetNumber] = useState("");
  const [addressSuburb, setAddressSuburb] = useState("");
  const [addressPostalCode, setAddressPostalCode] = useState("");
  const [comments, setComments] = useState("");
  const [startingDate, setStartingDate] = useState(new Date());

  //passwords
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  //userID
  const [userID, setUserID] = useState("");
  const [id, setID] = useState("");

  //-------------------------------UPDATE-----------------------------------------
  const user = api.user.getUserByID.useQuery({ id: id });

  //--------------------------------DROPDOWN BOXES--------------------------------
  const [isGreaterAreaOpen, setIsGreaterAreaOpen] = useState(false);
  const [greaterAreaOption, setGreaterAreaOption] = useState("Greater Area");
  const greaterAreaRef = useRef<HTMLDivElement>(null);
  const btnGreaterAreaRef = useRef<HTMLButtonElement>(null);

  const [isAreaOpen, setIsAreaOpen] = useState(false);
  const [areaOption, setAreaOption] = useState("Area");
  const areaRef = useRef<HTMLDivElement>(null);
  const btnAreaRef = useRef<HTMLButtonElement>(null);

  const [isStreetOpen, setIsStreetOpen] = useState(false);
  const [streetOption, setStreetOption] = useState("Street");
  const streetRef = useRef<HTMLDivElement>(null);
  const btnStreetRef = useRef<HTMLButtonElement>(null);
  const [streetOptions, setStreetOptions] = useState<string[]>([]);
  const [selectedStreet, setSelectedStreet] = useState<string>("");

  const [preferredCommunication, setPreferredCommunication] = useState(false);
  const [preferredOption, setPreferredCommunicationOption] = useState("Preferred Communication");
  const preferredCommunicationRef = useRef<HTMLDivElement>(null);
  const btnPreferredCommunicationRef = useRef<HTMLButtonElement>(null);

  const [role, setRole] = useState(false);
  const [roleOption, setRoleOption] = useState("Role");
  const roleRef = useRef<HTMLDivElement>(null);
  const btnRoleRef = useRef<HTMLButtonElement>(null);

  const [status, setStatus] = useState(false);
  const [statusOption, setStatusOption] = useState("Status");
  const statusRef = useRef<HTMLDivElement>(null);
  const btnStatusRef = useRef<HTMLButtonElement>(null);

  //Send user's details to user
  const [sendUserDetails, setSendUserDetails] = useState(false);

  //ID
  //get the last id of the users table
  const lastUserCreated = api.user.getLastUserID.useQuery();
  // const [id, setID] = useState("");

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
    setStreetOption("Street");
  };

  //SetStateAction<string>
  const handleAreaOption = (option: string) => {
    setAreaOption(option);
    setIsAreaOpen(false);

    //Makes the options one word for the key of the areaStreetMapping
    if (option === "Coniston Park") option = "ConistonPark";
    if (option === "Grassy Park") option = "GrassyPark";
    if (option === "Lavendar Hill") option = "LavendarHill";
    if (option === "Costa da Gamma") option = "CostaDaGamma";
    if (option === "Marina Da Gamma") option = "MarinaDaGamma";
    if (option === "Montagu V") option = "MontaguV";
    if (option === "Overcome Heights") option = "OvercomeHeights";
    if (option === "Pelican Park") option = "PelicanPark";
    if (option === "Seekoei vlei") option = "Seekoeivlei";
    if (option === "St Ruth") option = "StRuth";
    setStreetOptions(areaStreetMapping[option] ?? []);
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

  const areaOptions = [
    "Cafda",
    "Coniston Park",
    "Costa da Gamma",
    "Grassy Park",
    "Heideveld",
    "Hillview",
    "Khayelitsha",
    "Lavendar Hill",
    "Leeds",
    "Marina Da Gamma",
    "Montagu V",
    "Muizenberg",
    "Overcome Heights",
    "Pelican Park",
    "Seawinds",
    "Seekoei vlei",
    "St Ruth",
    "Steenberg",
    "Strandfontein",
    "Southfield",
    "Vrygrond",
  ];

  //STREET
  const handleToggleStreet = () => {
    setIsStreetOpen(!isStreetOpen);
  };

  const handleStreetOption = (option: SetStateAction<string>) => {
    setStreetOption(option);
    setIsStreetOpen(false);
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

  type AreaStreetMapping = Record<string, string[]>;

  const areaStreetMapping: AreaStreetMapping = {
    Cafda: ["12th Ave", "Komlossy", "Obeo Str"],
    ConistonPark: ["Coniston Court", "Frome Cres", "St Lucia Cres"],
    CostaDaGamma: ["Madeira Dr", "Minorca Rd", "Pembroke Pl", "The Breakers"],
    GrassyPark: ["1st Ave", "Grendell Cres", "Ishack Rd", "Perth Str", "Prince George Dr", "Stable Rd"],
    Heideveld: ["Amber Str"],
    Hillview: [
      "Aster Rd",
      "Bog Str",
      "Bonteberg Rd",
      "Cederberg Rd",
      "China Town",
      "Dahliah Rd",
      "Daisy Rd",
      "Darling Rd",
      "Depsiton Cres",
      "Drakensberg Rd",
      "Gladiola Rd",
      "Hillview Ave",
      "Hillview Heights",
      "Kamiesberg",
      "Langeberg Str",
      "Lebombo Rd",
      "Lilly Way",
      "Matola Rd",
      "Orchard Rd",
      "Outeniqua Str",
      "Pagoda Rd",
      "Phase 1",
      "Pilansberg",
      "Protea Way",
      "Rose Court",
      "Rose Str",
      "Sneeuberg",
      "Soutpansberg",
      "St Beatrice",
      "St Charles",
      "St Edwards",
      "St Irene",
      "St Orchard",
      "St Patricks",
      "St Paul",
      "St Swithin",
      "St Timothy",
      "St Vincent",
      "Sunflower Rd",
      "Tafelberg Rd",
      "Village Heights",
    ],
    Khayelitsha: ["Vuyani Str"],
    LavendarHill: [
      "Arundal Court",
      "Bartholomew Rd",
      "Chapel Rd",
      "Depsiton Cres",
      "Dover Court",
      "Elister",
      "Epston Cres",
      "Epston Rd",
      "Grindal Ave",
      "Hillary Dr",
      "Langeberg Rd",
      "Lebombo Str",
      "Maluti Str",
      "Parkin Court",
      "Pontac Court",
      "St Barbara Rd",
      "St Barnard",
      "St Benedict Str",
      "St Blaze Str",
      "St Paul Circ",
      "St Thomas Str",
      "Stone Court",
      "Stormvoel Rd",
      "Stuckeris Close",
      "Urfield Rd",
      "Van der Leur Court",
      "Village Heights",
      "Welton Rd",
    ],
    Leeds: ["Philbert Str"],
    MarinaDaGamma: ["Shearwater Dr"],
    MontaguV: [
      "St Agatha Rd",
      "St Ambrose",
      "St Augustine Rd",
      "St Barbara Rd",
      "St Barnabas",
      "St Bartholomew",
      "St Basil Str",
      "St Bede Str",
      "St Benedict Str",
      "St Bernard Cres",
      "St Blaize Str",
      "St Brendan Rd",
      "St Breda Str",
      "St Bridget",
      "St Cecilia",
      "St Christopher Rd",
      "St Paulse Circ",
      "St Thomas Str",
      "St Urban",
      "St Victor",
    ],
    Muizenberg: ["Hastings Rd", "Kensington Rd", "Ocean Breeze", "Ocean Villas", "Pambrook Pl", "Promenade Rd", "Shearwater Dr"],
    OvercomeHeights: [
      "7th Avenue",
      "Aster Rd",
      "Blaizer Str",
      "Bree Str",
      "Errol Str",
      "Freedom Rd",
      "Ghetto",
      "Italyfield",
      "Kennedy Rd",
      "Liberty Rd",
      "Masakoni Rd",
      "Mercy Rd",
      "Mountain Rd",
      "Phase 1",
      "Rasta Str",
      "United Ave",
      "Victory Str",
    ],
    PelicanPark: ["Penguin Str"],
    Retreat: [
      "3rdAve",
      "11 Ave",
      "12th Ave",
      "Brahms Rd",
      "Chad Rd",
      "Consort Rd",
      "Elgar Str",
      "Hugo Naude",
      "Komlossy Str",
      "Military Rd",
      "Oboe Str",
      "Runge Str",
      "Taupo Cl",
      "Tambourine Str",
      "Walton Rd",
    ],
    Seawinds: [
      "Falcon Str",
      "Finch Cres",
      "Francolin Str",
      "Kingfisher Rd",
      "Military Heights",
      "Orchard Str",
      "Penguin Str",
      "Puffin Rd",
      "Rooibekkie Str",
      "Seemeeu Circ",
      "Shrike Rd",
      "Sonata Str",
      "Spoonbill Cres",
      "St Beatrice",
      "St Edwards",
      "St Lewis Cl",
      "St Luke Cl",
      "St Patrick Ave",
      "St Peters",
      "St Phillips",
      "St Raymond Rd",
      "St Regis Str",
      "St Richard",
      "St Roberts",
      "St Sebastian",
      "St Stanislas",
      "St Stephens",
      "St Theresa",
      "St Theresa Cres",
      "St Timothy",
      "St Titus",
      "St Titus Cres",
      "St Urban",
      "St Urban Cl",
      "St Ursula",
      "St Wenceslas",
      "St William Cres",
      "Stormvoel Rd",
      "Sugarbird Str",
      "Swallow Str",
      "Swift Rd",
      "Woodpecker Str",
    ],
    Seekoeivlei: ["Victoria Rd"],
    StRuth: ["Cuban Heights"],
    Steenberg: [
      "Amber Rd",
      "Botma Str",
      "Craddock Rd",
      "Crystal Rd",
      "Flute Str",
      "Fontein Rd",
      "Grensweg",
      "Klavier Ln",
      "Orchestra Rd",
      "Rose Quartz",
      "Solo Str",
      "Squaw Rd",
      "Steen Villa",
      "Symphony Ave",
      "Turquoise Cres",
      "Zircon Circ",
    ],
    Strandfontein: ["Cabot Way", "Dennegeur"],
    Southfield: ["Princess Vuyo"],
    Vrygrond: [
      "Apple Cl",
      "Apple Rd",
      "Berg Str",
      "Berry Cl",
      "Berry Rd",
      "Church Circ",
      "Classen Rd",
      "Dassie Cl",
      "Dassie Rd",
      "Davids Rd",
      "Dawn Rd",
      "Disa Cl",
      "Disa Rd",
      "Doring Cl",
      "Doring Rd",
      "Drury Cl",
      "Drury Rd",
      "Fredericks Cl",
      "Fredericks Rd",
      "Harmony Cl",
      "Harmony Rd",
      "Jappie Rd",
      "Jonathan Rd",
      "Neville Riley Rd",
      "Orange Cl",
      "Orange Rd",
      "Peach Cl",
      "Peach Rd",
      "Philemon Rd",
      "Plum Str",
      "Thys Witbooi Cl",
      "Thys Witbooi Rd",
      "Trevor Siljeur Cl",
      "Trevor Siljeur Rd",
      "Vrygrond Ave",
      "Vuyo Cl",
      "Vuyo Rd",
    ],
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

  /*const handleUpdateUser = async () => {
    isUpdate ? setIsUpdate(false) : setIsUpdate(true);
    isCreate ? setIsCreate(false) : setIsCreate(false);
  };*/

  //-------------------------------UPDATE USER-----------------------------------------
  //Update the user's details
  const handleUpdateUserProfile = async (id: string) => {
    setID(id);

    if (user.data) {
      // Assuming userQuery.data contains the user object
      const userData = user.data;
      setFirstName(userData.name ?? "");
      setSurname(userData.surname ?? "");
      setEmail(userData.email ?? "");
      setMobile(userData.mobile ?? "");
      setGreaterAreaOption(userData.addressGreaterArea ?? "");
      setAreaOption(userData.addressArea ?? "");
      setStreetOption(userData.addressStreet ?? "");
      setAddressStreetCode(userData.addressStreetCode ?? "");
      setAddressStreetNumber(userData.addressStreetNumber ?? "");
      setAddressSuburb(userData.addressSuburb ?? "");
      setAddressPostalCode(userData.addressPostalCode ?? "");
      setPreferredCommunicationOption(userData.preferredCommunication ?? "");
      setStartingDate(userData.startingDate ?? new Date());
      setRoleOption(userData.role ?? "");
      setStatusOption(userData.status ?? "");
      setComments(userData.comments ?? "");
    }

    isUpdate ? setIsUpdate(true) : setIsUpdate(true);
    isCreate ? setIsCreate(false) : setIsCreate(false);
  };

  useEffect(() => {
    if (user.data) {
      // Assuming userQuery.data contains the user object
      const userData = user.data;
      setFirstName(userData.name ?? "");
      setSurname(userData.surname ?? "");
      setEmail(userData.email ?? "");
      setMobile(userData.mobile ?? "");
      setGreaterAreaOption(userData.addressGreaterArea ?? "");
      setAreaOption(userData.addressArea ?? "");
      setStreetOption(userData.addressStreet ?? "");
      setAddressStreetCode(userData.addressStreetCode ?? "");
      setAddressStreetNumber(userData.addressStreetNumber ?? "");
      setAddressSuburb(userData.addressSuburb ?? "");
      setAddressPostalCode(userData.addressPostalCode ?? "");
      setPreferredCommunicationOption(userData.preferredCommunication ?? "");
      setStartingDate(userData.startingDate ?? new Date());
      setRoleOption(userData.role ?? "");
      setStatusOption(userData.status ?? "");
      setComments(userData.comments ?? "");
    }
  }, [user.data]); // Effect runs when userQuery.data changes

  /*useEffect(() => {
    //set the user's details
    //handleUpdateUserProfile(userID);
  }, [userID]);*/

  const handleUpdateUser = async () => {
    if (greaterAreaOption === "Greater Area") {
      setGreaterAreaOption(" ");
    }
    if (preferredOption === "Preferred Communication") {
      setPreferredCommunicationOption(" ");
    }
    if (roleOption === "Role") {
      setRoleOption(" ");
    }
    if (statusOption === "Status") {
      setStatusOption(" ");
    }

    await updateUser.mutateAsync({
      id: id,
      firstName: firstName,
      email: email,
      surname: surname,
      mobile: mobile,
      addressGreaterArea: greaterAreaOption,
      addressArea: areaOption,
      addressStreet: streetOption,
      addressStreetCode: addressStreetCode,
      addressStreetNumber: addressStreetNumber,
      addressSuburb: addressSuburb,
      addressPostalCode: addressPostalCode,
      preferredCommunication: preferredOption,
      startingDate: startingDate,
      role: roleOption,
      status: statusOption,
      comments: comments,
      password: password,
    });
    //After the newUser has been created make sure to set the fields back to empty
    setFirstName("");
    setEmail("");
    setSurname("");
    setPassword("");
    setConfirmPassword("");
    setMobile("");
    setGreaterAreaOption("Greater Area");
    setStreetOption("Street");
    setAddressStreetCode("");
    setAddressStreetNumber("");
    setAddressSuburb("");
    setAddressPostalCode("");
    setPreferredCommunicationOption("Preferred Communication");
    setRoleOption("Role");
    setStatusOption("Status");
    setComments("");
    isUpdate ? setIsUpdate(false) : setIsUpdate(false);
    isCreate ? setIsCreate(false) : setIsCreate(false);
  };

  //-------------------------------CREATE NEW USER-----------------------------------------

  const handleCreateNewUser = async () => {
    isCreate ? setIsCreate(false) : setIsCreate(true);
    setIsUpdate(false);
  };
  //-------------------------------NEW USER-----------------------------------------

  const handleNewUser = async () => {
    if (password != confirmPassword) {
      console.log("Passwords do not match");
      return;
    }
    if (greaterAreaOption === "Greater Area") {
      setGreaterAreaOption(" ");
    }
    if (preferredOption === "Preferred Communication") {
      setPreferredCommunicationOption(" ");
    }
    if (roleOption === "Role") {
      setRoleOption(" ");
    }
    if (statusOption === "Status") {
      setStatusOption(" ");
    }

    await newUser.mutateAsync({
      firstName: firstName,
      email: email,
      surname: surname,
      password: password,
      mobile: mobile,
      addressGreaterArea: greaterAreaOption,
      addressArea: areaOption,
      addressStreet: streetOption,
      addressStreetCode: addressStreetCode,
      addressStreetNumber: addressStreetNumber,
      addressSuburb: addressSuburb,
      addressPostalCode: addressPostalCode,
      preferredCommunication: preferredOption,
      startingDate: startingDate,
      role: roleOption,
      status: statusOption,
      comments: comments,
    });
    //After the newUser has been created make sure to set the fields back to empty
    setFirstName("");
    setEmail("");
    setSurname("");
    setPassword("");
    setConfirmPassword("");
    setMobile("");
    setGreaterAreaOption("Greater Area");
    setStreetOption("Street");
    setAddressStreetCode("");
    setAddressStreetNumber("");
    setAddressSuburb("");
    setAddressPostalCode("");
    setPreferredCommunicationOption("Preferred Communication");
    setRoleOption("Role");
    setStatusOption("Status");
    setComments("");

    isCreate ? setIsCreate(false) : setIsCreate(false);
    isUpdate ? setIsUpdate(false) : setIsUpdate(false);
  };

  //-------------------------------BACK BUTTON-----------------------------------------
  const handleBackButton = () => {
    console.log("Back button pressed");
    setIsUpdate(false);
    setIsCreate(false);
    setID("");
    setFirstName("");
    setEmail("");
    setSurname("");
    setPassword("");
    setConfirmPassword("");
    setMobile("");
    setGreaterAreaOption("Greater Area");
    setStreetOption("Street");
    setAddressStreetCode("");
    setAddressStreetNumber("");
    setAddressSuburb("");
    setAddressPostalCode("");
    setPreferredCommunicationOption("Preferred Communication");
    setRoleOption("Role");
    setStatusOption("Status");
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
  const [streetCodeMessage, setStreetCodeMessage] = useState("");
  useEffect(() => {
    if (addressStreetCode.match(/^[0-9]+$/) == null && addressStreetCode.length != 0) {
      setStreetCodeMessage("Street code must only contain numbers");
    } else if (addressStreetCode.length > 4 && addressStreetCode.length != 0) {
      setStreetCodeMessage("Street code must be 4 digits or less");
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
    else if (password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/) == null && password.length != 0) {
      setPasswordMessage("Password must contain at least one upper case, one lower case, one number and one special character");
    }
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

  //On change of search bar, query the users table
  /* useEffect(() => {
        const userTableSearch = api.user.searchUsers.useQuery({ searchQuery: query });
    },[query]);*/

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
    //if (email === "") mandatoryFields.push("Email");
    if (mobile === "") mandatoryFields.push("Mobile");
    if (greaterAreaOption === "Greater Area") mandatoryFields.push("Greater Area");
    //if (addressStreet === "") mandatoryFields.push("Street");
    //if (addressStreetCode === "") mandatoryFields.push("Street Code");
    //if (addressStreetNumber === "") mandatoryFields.push("Street Number");
    //if (addressSuburb === "") mandatoryFields.push("Suburb");
    //if (addressPostalCode === "") mandatoryFields.push("Postal Code");
    //if (preferredOption === "Preferred Communication") mandatoryFields.push("Preferred Communication");
    if (roleOption === "Role") mandatoryFields.push("Role");
    if (statusOption === "Status") mandatoryFields.push("Status");
    if (startingDate === null) mandatoryFields.push("Starting Date");

    if (mobileMessage !== "") errorFields.push({ field: "Mobile", message: mobileMessage });
    if (streetCodeMessage !== "") errorFields.push({ field: "Street Code", message: streetCodeMessage });
    if (streetNumberMessage !== "") errorFields.push({ field: "Street Number", message: streetNumberMessage });
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
        void handleNewUser();
      }
    }
  };
  const handleCreateButtonModalClose = () => {
    setIsCreateButtonModalOpen(false);
  };
  const handleCreateButtonModalOpen = () => {
    setIsCreateButtonModalOpen(true);
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

  //-------------------------------------DATEPICKER--------------------------------------
  // Define the props for your custom input component
  interface CustomInputProps {
    value?: string;
    onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  }

  // Your CustomInput component with explicit types for the props
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
      <div className="m-1 mr-2">Starting date*:</div>
      {isUpdate ? startingDate?.toLocaleDateString() : value}
    </button>
  );

  return (
    <>
      <Head>
        <title>User Profiles</title>
      </Head>
      <main className="flex flex-col">
        <Navbar />
        {!isCreate && !isUpdate && (
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
                  onChange={(e) => setQuery(e.target.value)}
                />
                <button className="absolute right-0 top-0 mx-3 mb-3 rounded-lg bg-main-orange p-3 hover:bg-orange-500" onClick={handleCreateNewUser}>
                  Create new User
                </button>
              </div>
              {/*Make a table with all the users and then when you click on the user it will populate the fields*/}
              {/*<button
                    className="rounded-lg bg-orange-600 p-3 hover:bg-orange-700"
                    onClick={handleUpdateUser}
                    >
                    Search
                    </button>*/}
              <article className="horisonal-scroll mt-6 flex max-h-[80rem] w-full items-center justify-center overflow-auto rounded-md shadow-inner">
                <table className="table-auto">
                  <thead>
                    <tr>
                      <th className="px-4 py-2">User ID</th>
                      <th className="px-4 py-2">First Name</th>
                      <th className="px-4 py-2">Surname</th>
                      <th className="px-4 py-2">Email</th>
                      <th className="px-4 py-2">Mobile</th>
                      <th className="px-4 py-2">Greater Area</th>
                      <th className="px-4 py-2">Area</th>
                      <th className="px-4 py-2">Street</th>
                      <th className="px-4 py-2">Street Code</th>
                      <th className="px-4 py-2">Street Number</th>
                      <th className="px-4 py-2">Suburb</th>
                      <th className="px-4 py-2">Postal Code</th>
                      <th className="px-4 py-2">Preferred Communication</th>
                      <th className="px-4 py-2">Role</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2">Comments</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.data?.map((user) => {
                      return (
                        <tr className="items-center">
                          <td className="border px-4 py-2">{user.userID}</td>
                          <td className="border px-4 py-2">{user.name}</td>
                          <td className="border px-4 py-2">{user.surname}</td>
                          <td className="border px-4 py-2">{user.email}</td>
                          <td className="border px-4 py-2">{user.mobile}</td>
                          <td className="border px-4 py-2">{user.addressGreaterArea}</td>
                          <td className="border px-4 py-2">{user.addressArea}</td>
                          <td className="border px-4 py-2">{user.addressStreet}</td>
                          <td className="border px-4 py-2">{user.addressStreetCode}</td>
                          <td className="border px-4 py-2">{user.addressStreetNumber}</td>
                          <td className="border px-4 py-2">{user.addressSuburb}</td>
                          <td className="border px-4 py-2">{user.addressPostalCode}</td>
                          <td className="border px-4 py-2">{user.preferredCommunication}</td>
                          <td className="border px-4 py-2">{user.role}</td>
                          <td className="border px-4 py-2">{user.status}</td>
                          <td className="border px-4 py-2">{user.comments}</td>
                          <div className="flex">
                            <Trash
                              size={24}
                              className="mx-2 my-3 rounded-lg hover:bg-orange-200"
                              onClick={() => handleDeleteModal(user.id, String(user.userID), user.name ?? "")}
                            />
                            <Pencil size={24} className="mx-2 my-3 rounded-lg hover:bg-orange-200" onClick={() => handleUpdateUserProfile(String(user.id))} />
                          </div>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </article>
            </div>
          </>
        )}
        {(isCreate || isUpdate) && (
          <>
            <div className="flex justify-center">
              <div className="relative mb-4 flex grow flex-col items-center rounded-lg bg-slate-200 px-5 py-6">
                <div className=" text-2xl">{isUpdate ? "Update User" : "Create New User"}</div>
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
              {/*<div className="p-2">User ID: {(lastUserCreated?.data?.userID ?? 1000000) + 1}</div>*/}
              <div className="mb-2">All fields with * must be entered</div>
              <input
                className="m-2 rounded-lg border-2 border-slate-300 px-2 focus:border-black"
                placeholder="First Name*"
                onChange={(e) => setFirstName(e.target.value)}
                value={firstName}
              />

              <input
                className="m-2 rounded-lg border-2 border-slate-300 px-2 focus:border-black"
                placeholder="Surname*"
                onChange={(e) => setSurname(e.target.value)}
                value={surname}
              />

              <input
                className="m-2 rounded-lg border-2 border-slate-300 px-2 focus:border-black"
                placeholder="Email"
                onChange={(e) => setEmail(e.target.value)}
                value={email}
              />
              <input
                className="m-2 rounded-lg border-2 border-slate-300 px-2 focus:border-black"
                placeholder="Mobile*"
                onChange={(e) => setMobile(e.target.value)}
                value={mobile}
              />

              {mobileMessage && <div className="text-sm text-red-500">{mobileMessage}</div>}

              <div className="flex flex-col">
                <button
                  ref={btnGreaterAreaRef}
                  className="my-3 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                  type="button"
                  onClick={handleToggleGreaterArea}
                >
                  {isUpdate ? greaterAreaOption : greaterAreaOption + "*" + " "}
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

              <div className="flex flex-col">
                <button
                  ref={btnAreaRef}
                  className="my-3 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
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
                          <a href="#" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">
                            {option}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex flex-col">
                <button
                  ref={btnStreetRef}
                  className="my-3 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                  type="button"
                  onClick={handleToggleStreet}
                >
                  {streetOption + " "}
                  <svg className="ms-3 h-2.5 w-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                  </svg>
                </button>
                {isStreetOpen && (
                  <div ref={streetRef} className="z-10 w-44 divide-y divide-gray-100 rounded-lg bg-white shadow dark:bg-gray-700">
                    <ul className="py-2 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdownHoverButton">
                      {streetOptions.map((option) => (
                        <li key={option} onClick={() => handleStreetOption(option)}>
                          <a href="#" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">
                            {option}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <input
                className="m-2 rounded-lg border-2 border-slate-300 px-2 focus:border-black "
                placeholder="Street Code"
                onChange={(e) => setAddressStreetCode(e.target.value)}
                value={addressStreetCode}
              />
              {streetCodeMessage && <div className="text-sm text-red-500">{streetCodeMessage}</div>}
              <input
                className="m-2 rounded-lg border-2 border-slate-300 px-2 focus:border-black"
                placeholder="Street Number"
                onChange={(e) => setAddressStreetNumber(e.target.value)}
                value={addressStreetNumber}
              />
              {streetNumberMessage && <div className="text-sm text-red-500">{streetNumberMessage}</div>}
              <input
                className="m-2 rounded-lg border-2 border-slate-300 px-2 focus:border-black"
                placeholder="Suburb"
                onChange={(e) => setAddressSuburb(e.target.value)}
                value={addressSuburb}
              />
              <input
                className="m-2 rounded-lg border-2 border-slate-300 px-2 focus:border-black"
                placeholder="Postal Code"
                onChange={(e) => setAddressPostalCode(e.target.value)}
                value={addressPostalCode}
              />
              {postalCodeMessage && <div className="text-sm text-red-500">{postalCodeMessage}</div>}

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

              <div className="flex flex-col">
                <button
                  ref={btnRoleRef}
                  className="my-3 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                  type="button"
                  onClick={handleToggleRole}
                >
                  {roleOption + "*" + " "}
                  <svg className="ms-3 h-2.5 w-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                  </svg>
                </button>
                {role && (
                  <div ref={roleRef} className="z-10 w-44 divide-y divide-gray-100 rounded-lg bg-white shadow dark:bg-gray-700">
                    <ul className="py-2 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdownHoverButton">
                      {roleOptions.map((option) => (
                        <li key={option} onClick={() => handleRoleOption(option)}>
                          <a href="#" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">
                            {option}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex flex-col">
                <button
                  ref={btnStatusRef}
                  className="my-3 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                  type="button"
                  onClick={handleToggleStatus}
                >
                  {statusOption + "*" + " "}
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

              {/*DATEPICKER*/}
              <div className="p-4">
                <DatePicker
                  selected={startingDate}
                  onChange={(date) => setStartingDate(date!)}
                  dateFormat="dd/MM/yyyy"
                  customInput={<CustomInput />}
                  className="form-input rounded-md border px-4 py-2"
                />
              </div>

              <input
                className="m-2 rounded-lg border-2 border-slate-300 px-2 focus:border-black"
                placeholder="Comments"
                onChange={(e) => setComments(e.target.value)}
                value={comments}
              />

              <input
                className="m-2 rounded-lg border-2 border-slate-300 px-2 focus:border-black"
                placeholder="Password"
                onChange={(e) => setPassword(e.target.value)}
              />
              {passwordMessage && <div className="text-sm text-red-500">{passwordMessage}</div>}
              <input
                className="m-2 rounded-lg border-2 border-slate-300 px-2 focus:border-black"
                placeholder="Confirm Password"
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {confirmPasswordMessage && <div className="text-sm text-red-500">{confirmPasswordMessage}</div>}

              {/*Make a checkbox to confirm: "Welcome new user to preferred communication channel"  */}
              <div className="flex items-center">
                <input
                  id="checked-checkbox"
                  type="checkbox"
                  onChange={(e) => setSendUserDetails(e.target.checked)}
                  className="h-4 w-4 rounded bg-gray-100 text-main-orange accent-main-orange focus:ring-2"
                />
                <label htmlFor="checked-checkbox" className="ms-2 text-sm font-medium text-gray-900">
                  Welcome user to preferred communication channel
                </label>
              </div>

              <button className="my-4 rounded-md bg-main-orange px-8 py-3 text-lg hover:bg-orange-500" onClick={() => void handleCreateButtonModal()}>
                {isUpdate ? "Update" : "Create"}
              </button>
            </div>
          </>
        )}
      </main>
    </>
  );
};

export default User;
