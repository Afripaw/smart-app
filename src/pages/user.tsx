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

const User: NextPage = () => {
  const newUser = api.user.create.useMutation();
  const updateUser = api.user.update.useMutation();
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
  const [addressFreeForm, setAddressFreeForm] = useState("");
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
  //const [userID, setUserID] = useState("");
  const [id, setID] = useState("");

  //-------------------------------UPDATE USER-----------------------------------------
  const user = api.user.getUserByID.useQuery({ id: id });

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

  const [isStreetOpen, setIsStreetOpen] = useState(false);
  const [streetOption, setStreetOption] = useState("Select one");
  const streetRef = useRef<HTMLDivElement>(null);
  const btnStreetRef = useRef<HTMLButtonElement>(null);
  const [streetOptions, setStreetOptions] = useState<string[]>([]);

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

  //AREA
  const handleToggleArea = () => {
    setIsAreaOpen(!isAreaOpen);
    setStreetOption("Select one");
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

  //----------------------------COMMUNICATION OF USER DETAILS---------------------------
  //Send user's details to user
  //const [sendUserDetails, setSendUserDetails] = useState(false);

  //-------------------------------UPDATE USER-----------------------------------------
  //Update the user's details in fields
  const handleUpdateUserProfile = async (id: string) => {
    setID(id);

    if (user.data) {
      // Assuming userQuery.data contains the user object
      const userData = user.data;
      setFirstName(userData.name ?? "");
      setSurname(userData.surname ?? "");
      setEmail(userData.email ?? "");
      setMobile(userData.mobile ?? "");
      setGreaterAreaOption(userData.addressGreaterArea ?? "Select one");
      setAreaOption(userData.addressArea ?? "Select one");
      setStreetOption(userData.addressStreet ?? "Select one");
      setAddressStreetCode(userData.addressStreetCode ?? "");
      setAddressStreetNumber(userData.addressStreetNumber ?? "");
      setAddressSuburb(userData.addressSuburb ?? "");
      setAddressPostalCode(userData.addressPostalCode ?? "");
      setPreferredCommunicationOption(userData.preferredCommunication ?? "Select one");
      setStartingDate(userData.startingDate ?? new Date());
      setRoleOption(userData.role ?? "Select one");
      setStatusOption(userData.status ?? "Select one");
      setComments(userData.comments ?? "");

      //Make sure thet area and street options have a value
      if (userData.addressArea === "") {
        setAreaOption("Select one");
      }
      if (userData.addressStreet === "") {
        setStreetOption("Select one");
      }
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
      setGreaterAreaOption(userData.addressGreaterArea ?? "Select one");
      setAreaOption(userData.addressArea ?? "");
      setStreetOption(userData.addressStreet ?? "");
      setAddressStreetCode(userData.addressStreetCode ?? "");
      setAddressStreetNumber(userData.addressStreetNumber ?? "");
      setAddressSuburb(userData.addressSuburb ?? "");
      setAddressPostalCode(userData.addressPostalCode ?? "");
      setPreferredCommunicationOption(userData.preferredCommunication ?? "Select one");
      setStartingDate(userData.startingDate ?? new Date());
      setRoleOption(userData.role ?? "Select one");
      setStatusOption(userData.status ?? "Select one");
      setComments(userData.comments ?? "");

      //Make sure thet area and street options have a value
      console.log("Helllooo address area: " + userData.addressArea);
      if (userData.addressArea === "") {
        console.log("Area option is select one");
        setAreaOption("Select one");
      }
      if (userData.addressStreet === "") {
        setStreetOption("Select one");
      }
    }
  }, [user.data, isUpdate, isCreate]); // Effect runs when userQuery.data changes

  const handleUpdateUser = async () => {
    await updateUser.mutateAsync({
      id: id,
      firstName: firstName,
      email: email,
      surname: surname,
      mobile: mobile,
      addressGreaterArea: greaterAreaOption === "Select one" ? "" : greaterAreaOption,
      addressArea: areaOption === "Select one" ? "" : areaOption,
      addressStreet: streetOption === "Select one" ? "" : streetOption,
      addressStreetCode: addressStreetCode,
      addressStreetNumber: addressStreetNumber,
      addressSuburb: addressSuburb,
      addressPostalCode: addressPostalCode,
      preferredCommunication: preferredOption === "Select one" ? "" : preferredOption,
      startingDate: startingDate,
      role: roleOption === "Select one" ? "" : roleOption,
      status: statusOption === "Select one" ? "" : statusOption,
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
    setGreaterAreaOption("Select one");
    setAreaOption("Select one");
    setStreetOption("Select one");
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
    setAreaOption("Select one");
    setStreetOption("Select one");
    setPreferredCommunicationOption("Select one");
    setRoleOption("Select one");
    setStatusOption("Select one");
    isCreate ? setIsCreate(false) : setIsCreate(true);
    setIsUpdate(false);
  };
  //-------------------------------NEW USER-----------------------------------------

  const handleNewUser = async () => {
    await newUser.mutateAsync({
      firstName: firstName,
      email: email,
      surname: surname,
      password: password,
      mobile: mobile,
      addressGreaterArea: greaterAreaOption === "Select one" ? "" : greaterAreaOption,
      addressArea: areaOption === "Select one" ? "" : areaOption,
      addressStreet: streetOption === "Select one" ? "" : streetOption,
      addressStreetCode: addressStreetCode,
      addressStreetNumber: addressStreetNumber,
      addressSuburb: addressSuburb,
      addressPostalCode: addressPostalCode,
      preferredCommunication: preferredOption === "Select one" ? "" : preferredOption,
      startingDate: startingDate,
      role: roleOption === "Select one" ? "" : roleOption,
      status: statusOption === "Select one" ? "" : statusOption,
      comments: comments,
    });
    //After the newUser has been created make sure to set the fields back to empty
    setFirstName("");
    setEmail("");
    setSurname("");
    setPassword("");
    setConfirmPassword("");
    setMobile("");
    setGreaterAreaOption("Select one");
    setAreaOption("Select one");
    setStreetOption("Select one");
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

    console.log("View profile page: ", JSON.stringify(user.data));
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
      console.log("Select one");

      //Make sure thet area and street options have a value
      if (userData.addressArea === "Select one") {
        setAreaOption("");
        console.log("Area option is select one");
      }
      if (userData.addressStreet === "Select one") {
        setStreetOption("");
        console.log("Street option is select one");
      }
    }

    setIsUpdate(false);
    setIsCreate(false);
    setIsViewProfilePage(true);
  };

  useEffect(() => {
    //console.log("View profile page: ", JSON.stringify(user.data));
    if (user.data) {
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
      //console.log("Select one");
      //Make sure thet area and street options have a value
      if (userData.addressArea === "Select one" && !isUpdate) {
        setAreaOption("");
      }
      if (userData.addressStreet === "Select one" && !isUpdate) {
        setStreetOption("");
      }
      if (userData.addressArea === "" && isUpdate) {
        setAreaOption("Select one");
      }
      if (userData.addressStreet === "" && isUpdate) {
        setStreetOption("Select one");
      }
    }
  }, [isViewProfilePage, user.data]); // Effect runs when userQuery.data changes

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
    setPassword("");
    setConfirmPassword("");
    setMobile("");
    setGreaterAreaOption("Select one");
    setAreaOption("Select one");
    setStreetOption("Select one");
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
    if (password === "" && !isUpdate) mandatoryFields.push("Password");
    if (confirmPassword === "" && !isUpdate) mandatoryFields.push("Confirm Password");

    if (mobileMessage !== "") errorFields.push({ field: "Mobile", message: mobileMessage });
    //if (streetCodeMessage !== "") errorFields.push({ field: "Street Code", message: streetCodeMessage });
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
        <title>User Profiles</title>
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
                  onChange={(e) => setQuery(e.target.value)}
                />
                <button className="absolute right-0 top-0 mx-3 mb-3 rounded-lg bg-main-orange p-3 hover:bg-orange-500" onClick={handleCreateNewUser}>
                  Create new User
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
                      <th className="px-4 py-2">Area</th>
                      <th className="px-4 py-2">Role</th>
                      <th className="px-4 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {user_data?.map((user) => {
                      return (
                        <tr className="items-center">
                          <td className="border px-4 py-2">{user.name}</td>
                          <td className="border px-4 py-2">{user.surname}</td>
                          <td className="border px-4 py-2">{user.email}</td>
                          <td className="border px-4 py-2">{user.mobile}</td>
                          <td className="border px-4 py-2">{user.addressGreaterArea}</td>
                          <td className="border px-4 py-2">{user.addressArea}</td>
                          <td className="border px-4 py-2">{user.role}</td>
                          <td className="border px-4 py-2">{user.status}</td>
                          <div className="flex">
                            <Trash
                              size={24}
                              className="mx-2 my-3 rounded-lg hover:bg-orange-200"
                              onClick={() => handleDeleteModal(user.id, String(user.userID), user.name ?? "")}
                            />
                            <Pencil size={24} className="mx-2 my-3 rounded-lg hover:bg-orange-200" onClick={() => handleUpdateUserProfile(String(user.id))} />
                            <AddressBook
                              size={24}
                              className="mx-2 my-3 rounded-lg hover:bg-orange-200"
                              onClick={() => handleViewProfilePage(String(user.id))}
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
                <b className=" text-2xl">{isUpdate ? "Update User Data" : "Create New User"}</b>
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
                  <div className="mb-2 flex text-center">
                    {"("}All fields with <div className="px-1 text-lg text-main-orange"> * </div> are compulsary{")"}
                  </div>
                </div>

                <div className="my-2 flex w-full flex-col rounded-lg border-2 p-4">
                  <b className="mb-3 text-center text-xl">Personal & Contact Data</b>
                  <div className="flex items-center">
                    <div className="flex">
                      <span className="text-white">1</span>
                      1. First Name<div className="text-lg text-main-orange">*</div>:{" "}
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
                      <span className="text-white">1</span>
                      2. Surname<div className="text-lg text-main-orange">*</div>:{" "}
                    </div>
                    <input
                      className="m-2 rounded-lg border-2 border-slate-300 px-2 focus:border-black"
                      placeholder="Type here: e.g. Doe"
                      onChange={(e) => setSurname(e.target.value)}
                      value={surname}
                    />
                  </div>

                  <div className="flex items-center">
                    <span className="text-white">1</span>
                    <div>3. Email: </div>
                    <input
                      className="m-2 rounded-lg border-2 border-slate-300 px-2 focus:border-black"
                      placeholder="Type here: e.g. jd@gmail.com"
                      onChange={(e) => setEmail(e.target.value)}
                      value={email}
                    />
                  </div>

                  <div className="flex items-center">
                    <div className="flex">
                      <span className="text-white">1</span>
                      4. Mobile<div className="text-lg text-main-orange">*</div>:{" "}
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
                        <span className="text-white">1</span>
                        5. Preferred Communication Channel<div className="text-lg text-main-orange">*</div>:{" "}
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
                </div>

                <div className="my-2 flex w-full flex-col rounded-lg border-2 p-4">
                  <b className="mb-3 text-center text-xl">Geographical & Location Data</b>
                  <div className="flex flex-col divide-y-2 divide-gray-300">
                    <div className="flex items-start">
                      <div className="mr-3 flex items-center pt-4">
                        <div className="flex">
                          <span className="text-white">1</span>
                          6. Greater Area<div className="text-lg text-main-orange">*</div>:{" "}
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

                    <div className="flex items-start divide-x-2 divide-gray-300">
                      <div className="flex flex-col pr-2">
                        <div className="flex items-start">
                          <div className="mr-3 flex items-center pt-5">
                            <div className="mr-3 flex">
                              <span className="text-white">1</span>7. Area:{" "}
                            </div>
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
                        </div>

                        <div className="flex items-start">
                          <div className="mr-3 flex items-center pt-5">
                            <div className="mr-3 flex">
                              <span className="text-white">1</span>8. Street:{" "}
                            </div>
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
                        </div>

                        <div className="flex items-center">
                          <div className="mr-3 flex">
                            <span className="text-white">1</span> 9. Street Code:{" "}
                          </div>
                          <input
                            className="m-2 rounded-lg border-2 border-slate-300 px-2 focus:border-black "
                            placeholder="Type here: e.g. 1234"
                            onChange={(e) => setAddressStreetCode(e.target.value)}
                            value={addressStreetCode}
                          />
                        </div>
                        {/*{streetCodeMessage && <div className="text-sm text-red-500">{streetCodeMessage}</div>}*/}

                        <div className="flex items-center">
                          <div className="mr-3">10. Street Number: </div>
                          <input
                            className="m-2 rounded-lg border-2 border-slate-300 px-2 focus:border-black"
                            placeholder="Type here: e.g. 1234"
                            onChange={(e) => setAddressStreetNumber(e.target.value)}
                            value={addressStreetNumber}
                          />
                        </div>
                        {streetNumberMessage && <div className="text-sm text-red-500">{streetNumberMessage}</div>}

                        <div className="flex items-center">
                          <div>11. Suburb: </div>
                          <input
                            className="m-2 rounded-lg border-2 border-slate-300 px-2 focus:border-black"
                            placeholder="Type here: e.g. Plaza"
                            onChange={(e) => setAddressSuburb(e.target.value)}
                            value={addressSuburb}
                          />
                        </div>

                        <div className="flex items-center">
                          <div>12. Postal Code: </div>
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
                        <div>Or Alternatively Free Form Address</div>
                        <textarea
                          className=" h-64 w-72 rounded-lg border-2 border-slate-300 px-2 focus:border-black"
                          placeholder="Type here: e.g. 1234 Plaza, 1234"
                          onChange={(e) => setAddressFreeForm(e.target.value)}
                          value={addressFreeForm}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="my-2 flex w-full flex-col rounded-lg border-2 p-4">
                  <b className="mb-3 text-center text-xl">Afripaw Association Data</b>
                  <div className="flex items-start">
                    <div className="mr-3 flex items-center pt-5">
                      <div className="mr-3 flex">
                        13. Role<div className="text-lg text-main-orange">*</div>:{" "}
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <button
                        ref={btnRoleRef}
                        className="my-3 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
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
                    <div className="mr-3 flex items-center pt-5">
                      <div className="mr-3 flex">
                        14. Status<div className="text-lg text-main-orange">*</div>:{" "}
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
                      15. Starting Date<div className="text-lg text-main-orange">*</div>:{" "}
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
                    <div className="mr-3 pt-3">16. Comments: </div>
                    <textarea
                      className="m-2 h-24 w-60 rounded-lg border-2 border-slate-300 px-2 focus:border-black"
                      placeholder="Type here: e.g. Hard worker"
                      onChange={(e) => setComments(e.target.value)}
                      value={comments}
                    />
                  </div>

                  <div className="flex items-center">
                    <div className="mr-3 flex ">
                      17. Password<div className="text-lg text-main-orange">*</div>:{" "}
                    </div>
                    <input
                      className="m-2 rounded-lg border-2 border-slate-300 px-2 focus:border-black"
                      placeholder="Type here: e.g. JohnDoe$123"
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  {passwordMessage && <div className="text-sm text-red-500">{passwordMessage}</div>}

                  <div className="flex items-center">
                    <div className="mr-3 flex">
                      <span className="text-white">17. </span> Confirm Password<div className="text-lg text-main-orange">*</div>:{" "}
                    </div>
                    <input
                      className="m-2 rounded-lg border-2 border-slate-300 px-2 focus:border-black"
                      placeholder="Type here: e.g. JohnDoe$123"
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                  {confirmPasswordMessage && <div className="text-sm text-red-500">{confirmPasswordMessage}</div>}

                  <div className="flex items-center">
                    <span className="text-white">17. </span>
                    <input
                      id="checked-checkbox"
                      type="checkbox"
                      // onChange={(e) => setSendUserDetails(e.target.checked)}
                      className="h-4 w-4 rounded bg-gray-100 text-main-orange accent-main-orange focus:ring-2"
                    />
                    <label htmlFor="checked-checkbox" className="ms-2 text-sm font-medium text-gray-900">
                      Send login credentials via preferred communication channel
                    </label>
                  </div>
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
                <div className=" text-2xl">User Profile</div>
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
                  <b className="mr-3">User ID:</b> {user?.data?.userID}
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
                  <b className="mr-3">Area:</b> {areaOption}
                </div>

                <div className="mb-2 flex items-center">
                  <b className="mr-3">Street:</b> {streetOption}
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
                  <b className="mr-3">Role:</b> {roleOption}
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

export default User;
