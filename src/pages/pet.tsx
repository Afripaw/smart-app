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
import ImageUploadModal from "~/components/imageUploadModal";
import { areaOptions } from "~/components/GeoLocation/areaOptions";
import { areaStreetMapping } from "~/components/GeoLocation/areaStreetMapping";
import { clinicDates } from "~/components/clinicsAttended";

//Icons
import { AddressBook, FirstAidKit, Pencil, Printer, Trash, UserCircle, Users, Bed } from "phosphor-react";

//Date picker
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { UploadButton } from "~/utils/uploadthing";
import { useSession } from "next-auth/react";
import Input from "~/components/Base/Input";
import { bg } from "date-fns/locale";
import { set } from "date-fns";
import { string } from "zod";

const Pet: NextPage = () => {
  useSession({ required: true });

  //For moving between different pages
  const router = useRouter();

  const newPet = api.pet.create.useMutation();
  const updatePet = api.pet.update.useMutation();
  const [isUpdate, setIsUpdate] = useState(false);
  const [isCreate, setIsCreate] = useState(false);
  //Update the table when user is deleted
  const [isDeleted, setIsDeleted] = useState(false);

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
  const [petName, setPetName] = useState("");
  const [ownerID, setOwnerID] = useState(0);

  const [markings, setMarkings] = useState("");
  const [comments, setComments] = useState("");
  const [startingDate, setStartingDate] = useState(new Date());
  const [image, setImage] = useState("");

  //userID
  //const [userID, setUserID] = useState("");
  const [id, setID] = useState(0);

  //---------------------------------NAVIGATION OF OWNER TO PET----------------------------------
  useEffect(() => {
    if (router.asPath.includes("ownerID")) {
      setOwnerID(Number(router.asPath.split("=")[1]));
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

  //make sure the ownerID is not 0
  useEffect(() => {
    if (ownerID != 0) {
      setOwnerID(Number(router.asPath.split("=")[1]));
    }
  }, [isCreate]);

  //-------------------------------NAVIGATING BY CLICKING ON THE TAB---------------------
  useEffect(() => {
    if (!isCreate) {
      setOwnerID(Number(user?.data?.pet_data?.ownerID ?? 0));
    }
  }, [router.asPath]);

  const owner = api.petOwner.getOwnerByID.useQuery({ petOwnerID: ownerID });

  useEffect(() => {
    void owner.refetch();
  }, []);

  // const handleNavbarLinkClick = () => {
  //   setIsUpdate(false);
  //   setIsCreate(false);
  //   setIsViewProfilePage(false);
  // };

  //-------------------------------UPDATE USER-----------------------------------------
  const user = api.pet.getPetByID.useQuery({ petID: id });

  //Add clinic to pet
  const addClinic = api.pet.addClinicToPet.useMutation();

  //Order fields
  const [order, setOrder] = useState("petName");

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
  const [colourOption, setColourOption] = useState("Select one");
  const colourRef = useRef<HTMLDivElement>(null);
  const btnColourRef = useRef<HTMLButtonElement>(null);

  const [status, setStatus] = useState(false);
  const [statusOption, setStatusOption] = useState("Select one");
  const statusRef = useRef<HTMLDivElement>(null);
  const btnStatusRef = useRef<HTMLButtonElement>(null);

  const [sterilisationStatus, setSterilisationStatus] = useState(false);
  const [sterilisationStatusOption, setSterilisationStatusOption] = useState("Select one");
  const sterilisationStatusRef = useRef<HTMLDivElement>(null);
  const btnSterilisationStatusRef = useRef<HTMLButtonElement>(null);

  const [sterilisationRequested, setSterilisationRequested] = useState(false);
  const [sterilisationRequestedOption, setSterilisationRequestedOption] = useState("Select one");
  const sterilisationRequestedRef = useRef<HTMLDivElement>(null);
  const btnSterilisationRequestedRef = useRef<HTMLButtonElement>(null);

  const [sterilisationRequestSigned, setSterilisationRequestSigned] = useState(false);
  const [sterilisationRequestSignedOption, setSterilisationRequestSignedOption] = useState("Select one");
  const sterilisationRequestSignedRef = useRef<HTMLDivElement>(null);
  const btnSterilisationRequestSignedRef = useRef<HTMLButtonElement>(null);

  const [sterilisationOutcome, setSterilisationOutcome] = useState(false);
  const [sterilisationOutcomeOption, setSterilisationOutcomeOption] = useState("Select one");
  const sterilisationOutcomeRef = useRef<HTMLDivElement>(null);
  const btnSterilisationOutcomeRef = useRef<HTMLButtonElement>(null);

  const [vaccinationShot1, setVaccinationShot1] = useState(false);
  const [vaccinationShot1Option, setVaccinationShot1Option] = useState("Select one");
  const vaccinationShot1Ref = useRef<HTMLDivElement>(null);
  const btnVaccinationShot1Ref = useRef<HTMLButtonElement>(null);

  const [vaccinationShot2, setVaccinationShot2] = useState(false);
  const [vaccinationShot2Option, setVaccinationShot2Option] = useState("Select one");
  const vaccinationShot2Ref = useRef<HTMLDivElement>(null);
  const btnVaccinationShot2Ref = useRef<HTMLButtonElement>(null);

  const [vaccinationShot3, setVaccinationShot3] = useState(false);
  const [vaccinationShot3Option, setVaccinationShot3Option] = useState("Select one");
  const vaccinationShot3Ref = useRef<HTMLDivElement>(null);
  const btnVaccinationShot3Ref = useRef<HTMLButtonElement>(null);

  const [membershipType, setMembershipType] = useState(false);
  const [membershipTypeOption, setMembershipTypeOption] = useState("Select one");
  const membershipTypeRef = useRef<HTMLDivElement>(null);
  const btnMembershipTypeRef = useRef<HTMLButtonElement>(null);

  const [cardStatus, setCardStatus] = useState(false);
  const [cardStatusOption, setCardStatusOption] = useState("Select one");
  const cardStatusRef = useRef<HTMLDivElement>(null);
  const btnCardStatusRef = useRef<HTMLButtonElement>(null);

  const [kennelsReceived, setKennelsReceived] = useState(false);
  const [kennelsReceivedOption, setKennelsReceivedOption] = useState("Select one");
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
      setAgeOption("Select one");
      setAgeOptions(ageCatOptions);
    } else if (speciesOption == "Dog") {
      setAgeOption("Select one");
      setAgeOptions(ageDogOptions);
    }
  }, [speciesOption]);

  //BREED
  const handleToggleBreed = () => {
    setIsBreedOpen(!isBreedOpen);
  };

  const handleBreedOption = (option: SetStateAction<string>) => {
    setBreedOption(option);
    setIsBreedOpen(false);
  };

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

  const [breedOptions, setBreedOptions] = useState([""]);

  useEffect(() => {
    if (speciesOption == "Cat") {
      setBreedOption("Not Applicable");
      setBreedOptions(["Not Applicable"]);
    } else if (speciesOption == "Dog") {
      setBreedOption("Select one");
      setBreedOptions(breedDogOptions);
    }
  }, [speciesOption]);

  //COLOUR
  const handleToggleColour = () => {
    setIsColourOpen(!isColourOpen);
  };

  const handleColourOption = (option: SetStateAction<string>) => {
    setColourOption(option);
    setIsColourOpen(false);
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
    if (speciesOption == "Cat") {
      setColourOption("Select one");
      setColourOptions(colourCatOptions);
    } else if (speciesOption == "Dog") {
      setColourOption("Select one");
      setColourOptions(colourDogOptions);
    }
  }, [speciesOption]);

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

  const sterilisationStatusOptions = ["Yes", "No", "Unknown"];

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
      setSterilisationRequestSignedOption("Select one");
      setSterilisationRequestSignedOptions(sterilisationRequestConfirmedSignedOptions);
    }
    // other code if needed
  }, []); // Add dependencies here

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

  const sterilisationOutcomeOptions = ["Actioned", "No show"];

  //VACCINATION SHOT 1
  const handleToggleVaccinationShot1 = () => {
    setVaccinationShot1(!status);
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

  //VACCINATION SHOT 2
  const handleToggleVaccinationShot2 = () => {
    setVaccinationShot2(!status);
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

  //VACCINATION SHOT 3
  const handleToggleVaccinationShot3 = () => {
    setVaccinationShot3(!status);
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

  const membershipTypeOptions = ["Non-card holder", "Standard card holder", "Gold card holder"];

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

  const cardStatusOptions =
    membershipTypeOption == "Non-card holder" ? ["Not applicable"] : ["Not applicable", "Collect", "Issued", "Re-print", "Lapsed card holder"];

  //KENNELS RECEIVED
  const [kennelList, setKennelList] = useState<string[]>([]);
  //show all available options
  const kennelsReceivedOptions = ["2018", "2019", "2020", "2021", "2022", "2023", "2024"];

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

  //CLINICSATTENDED
  //All clinics in petClinic table
  const clinicsAttendedOptions = api.petClinic.getAllClinics.useQuery().data ?? [];

  // const clinicsAttendedOptions = ["Clinic 1", "Clinic 2", "Clinic 3"];
  const [clinicsAttended, setClinicsAttended] = useState(false);
  const [clinicsAttendedOption, setClinicsAttendedOption] = useState("Select here");
  const clinicsAttendedRef = useRef<HTMLDivElement>(null);
  const btnClinicsAttendedRef = useRef<HTMLButtonElement>(null);

  //The list of clinics that the user has attended
  const [clinicList, setClinicList] = useState<string[]>([]);
  const [clinicIDList, setClinicIDList] = useState<number[]>([]);

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

  const handleClinicsAttendedOption = (option: SetStateAction<string>, optionID: number) => {
    setClinicsAttended(false);
    setShowClinicsAttended(false);
    setClinicsAttendedOption(option);
    if (!clinicList.includes(String(option))) {
      setClinicList([...clinicList, String(option)]);
      setClinicIDList([...clinicIDList, optionID]);
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
    // Combine clinic names and their IDs into a single array
    const combinedClinicList = clinicList.map((clinic, index) => ({
      name: clinic,
      id: clinicIDList[index],
    }));

    // Sort the combined array based on the clinic names (dates)
    combinedClinicList.sort((a, b) => compareDates(a.name, b.name));

    // Separate the sorted clinic names and IDs back into their respective arrays
    const sortedClinicList = combinedClinicList.map((item) => item.name);
    const sortedClinicIDList = combinedClinicList.map((item) => item.id);

    // Update the states
    setClinicList(sortedClinicList);
    setClinicIDList(sortedClinicIDList.filter((id) => id !== undefined) as number[]);

    console.log("Sorted clinic list", sortedClinicList);
    console.log("Sorted clinic ID list", sortedClinicIDList);
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

  //LAST DEWORMING
  //take the last date of the clinics that were attended and set as default for last deworming
  //const lastClinic = clinicList[clinicList.length - 1];
  //const lastClinicDate = lastClinic?.split("/").map(Number);
  const [lastDeworming, setLastDeworming] = useState(new Date());
  useEffect(() => {
    const dateString = clinicDates[0] ?? "";
    // const [day, month, year] = dateString.split("/");
    // const formattedDate = `${year}-${month}-${day}`;
    // setLastDeworming(new Date(formattedDate));
    const [day, month, year] = dateString.split("/").map((part) => parseInt(part, 10));
    if (!Number.isNaN(day) && !Number.isNaN(month) && !Number.isNaN(year)) {
      // JavaScript's Date month is 0-indexed, so subtract 1 from the month.
      const dateObject = new Date(year ?? 0, (month ?? 0) - 1, day ?? 0);
      setLastDeworming(dateObject);
      console.log("Last deworming", dateObject);
    }
  }, []);

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
      {isUpdate ? lastDeworming?.toLocaleDateString() : value}
    </button>
  );

  //----------------------------COMMUNICATION OF USER DETAILS---------------------------
  //Send user's details to user
  //const [sendUserDetails, setSendUserDetails] = useState(false);

  //-------------------------------UPDATE USER-----------------------------------------
  //Update the user's details in fields
  const handleUpdateUserProfile = async (id: number) => {
    setID(id);

    if (user.data) {
      // Assuming userQuery.data contains the user object
      const userData = user.data.pet_data;
      //Get all the clinic dates and put in a string array
      const clinicData = user.data.clinic_data;
      const clinicDates =
        clinicData?.map(
          (clinic) =>
            clinic.clinic.date.getDate().toString() +
            "/" +
            ((clinic.clinic.date.getMonth() ?? 0) + 1).toString() +
            "/" +
            clinic.clinic.date.getFullYear().toString(),
        ) ?? [];
      const clinicIDs = clinicData?.map((clinic) => clinic.clinicID) ?? [];
      setPetName(userData?.petName ?? "");
      setSpeciesOption(userData?.species ?? "Select one");
      setSexOption(userData?.sex ?? "Select one");
      setAgeOption(userData?.age ?? "Select one");
      setBreedOption(userData?.breed ?? "Select one");
      setColourOption(userData?.colour ?? "Select one");
      setMarkings(userData?.markings ?? "");
      setStatusOption(userData?.status ?? "Select one");
      setSterilisationStatusOption(userData?.sterilisedStatus ?? "Select one");
      setSterilisationRequestedOption(userData?.sterilisedRequested ?? "Select one");
      setSterilisationOutcomeOption(userData?.sterilisationOutcome ?? "Select one");
      setVaccinationShot1Option(userData?.vaccinationShot1 ?? "Select one");
      setVaccinationShot2Option(userData?.vaccinationShot2 ?? "Select one");
      setVaccinationShot3Option(userData?.vaccinationShot3 ?? "Select one");
      setMembershipTypeOption(userData?.membership ?? "Select one");
      setCardStatusOption(userData?.cardStatus ?? "Select one");
      setKennelList(userData?.kennelReceived ?? []);
      setLastDeworming(userData?.lastDeworming ?? new Date());
      setClinicIDList(clinicIDs ?? []);
      setClinicList(clinicDates ?? []);
      setComments(userData?.comments ?? "");
    }

    //isUpdate ? setIsUpdate(true) : setIsUpdate(true);
    //isCreate ? setIsCreate(false) : setIsCreate(false);
    setIsUpdate(true);
    setIsCreate(false);
  };

  useEffect(() => {
    if (user.data) {
      // Assuming userQuery.data contains the user object
      const userData = user.data.pet_data;
      //Get all the clinic dates and put in a string array
      const clinicData = user.data.clinic_data;
      const clinicDates =
        clinicData?.map(
          (clinic) =>
            clinic.clinic.date.getDate().toString() +
            "/" +
            ((clinic.clinic.date.getMonth() ?? 0) + 1).toString() +
            "/" +
            clinic.clinic.date.getFullYear().toString(),
        ) ?? [];
      const clinicIDs = clinicData?.map((clinic) => clinic.clinicID) ?? [];
      setPetName(userData?.petName ?? "");
      setSpeciesOption(userData?.species ?? "Select one");
      setSexOption(userData?.sex ?? "Select one");
      setAgeOption(userData?.age ?? "Select one");
      setBreedOption(userData?.breed ?? "Select one");
      setColourOption(userData?.colour ?? "Select one");
      setMarkings(userData?.markings ?? "");
      setStatusOption(userData?.status ?? "Select one");
      setSterilisationStatusOption(userData?.sterilisedStatus ?? "Select one");
      setSterilisationRequestedOption(userData?.sterilisedRequested ?? "Select one");
      setSterilisationRequestSignedOption(userData?.sterilisedRequestSigned ?? "Select one");
      setSterilisationOutcomeOption(userData?.sterilisationOutcome ?? "Select one");
      setVaccinationShot1Option(userData?.vaccinationShot1 ?? "Select one");
      setVaccinationShot2Option(userData?.vaccinationShot2 ?? "Select one");
      setVaccinationShot3Option(userData?.vaccinationShot3 ?? "Select one");
      setMembershipTypeOption(userData?.membership ?? "Select one");
      setCardStatusOption(userData?.cardStatus ?? "Select one");
      setKennelList(userData?.kennelReceived ?? []);
      setLastDeworming(userData?.lastDeworming ?? new Date());
      setStatusOption(userData?.status ?? "Select one");
      setComments(userData?.comments ?? "");
      setClinicList(clinicDates ?? []);
      setClinicIDList(clinicIDs ?? []);
    }
  }, [user.data, isUpdate, isCreate]); // Effect runs when userQuery.data changes

  const handleUpdateUser = async () => {
    await updatePet.mutateAsync({
      petID: id,
      petName: petName,
      species: speciesOption === "Select one" ? "" : speciesOption,
      sex: sexOption === "Select one" ? "" : sexOption,
      age: ageOption === "Select one" ? "" : ageOption,
      breed: breedOption === "Select one" ? "" : breedOption,
      colour: colourOption === "Select one" ? "" : colourOption,
      markings: markings,
      status: statusOption === "Select one" ? "" : statusOption,
      sterilisedStatus: sterilisationStatusOption === "Select one" ? "" : sterilisationStatusOption,
      sterilisedRequested: sterilisationRequestedOption === "Select one" ? "" : sterilisationRequestedOption,
      sterilisedRequestSigned: sterilisationRequestSignedOption === "Select one" ? "" : sterilisationRequestSignedOption,
      sterilisedOutcome: sterilisationOutcomeOption === "Select one" ? "" : sterilisationOutcomeOption,
      vaccinationShot1: vaccinationShot1Option === "Select one" ? "" : vaccinationShot1Option,
      vaccinationShot2: vaccinationShot2Option === "Select one" ? "" : vaccinationShot2Option,
      vaccinationShot3: vaccinationShot3Option === "Select one" ? "" : vaccinationShot3Option,
      lastDeWorming: lastDeworming ?? new Date(),
      membership: membershipTypeOption === "Select one" ? "" : membershipTypeOption,
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
    setBreedOption("Select one");
    setColourOption("Select one");
    setMarkings("");
    setStatusOption("Select one");
    setSterilisationStatusOption("Select one");
    setSterilisationRequestedOption("Select one");
    setSterilisationOutcomeOption("Select one");
    setVaccinationShot1Option("Select one");
    setVaccinationShot2Option("Select one");
    setVaccinationShot3Option("Select one");
    setMembershipTypeOption("Select one");
    setCardStatusOption("Select one");
    setKennelsReceivedOption("Select one");
    setLastDeworming(new Date());
    setComments("");
    setClinicList([]);
    setIsUpdate(false);
    setIsCreate(false);
  };

  //-------------------------------CREATE NEW USER-----------------------------------------

  const handleCreateNewUser = async () => {
    setPetName("");
    setSpeciesOption("Select one");
    setSexOption("Select one");
    setAgeOption("Select one");
    setBreedOption("Select one");
    setColourOption("Select one");
    setMarkings("");
    setStatusOption("Select one");
    setSterilisationStatusOption("Select one");
    setSterilisationRequestedOption("Select one");
    setSterilisationOutcomeOption("Select one");
    setVaccinationShot1Option("Select one");
    setVaccinationShot2Option("Select one");
    setVaccinationShot3Option("Select one");
    setMembershipTypeOption("Select one");
    setCardStatusOption("Select one");
    setKennelsReceivedOption("Select one");
    setStartingDate(new Date());
    setLastDeworming(new Date());
    setComments("");
    //isCreate ? setIsCreate(false) : setIsCreate(true);
    setClinicList([]);
    setIsCreate(true);
    setIsUpdate(false);
  };
  //-------------------------------NEW USER-----------------------------------------

  const handleNewUser = async () => {
    console.log("Owner ID for pet creation: ", ownerID);
    console.log("All clinics attended: ", clinicIDList);
    const newUser_ = await newPet.mutateAsync({
      ownerID: Number(router.asPath.split("=")[1]),
      petName: petName,
      species: speciesOption === "Select one" ? "" : speciesOption,
      sex: sexOption === "Select one" ? "" : sexOption,
      age: ageOption === "Select one" ? "" : ageOption,
      breed: breedOption === "Select one" ? "" : breedOption,
      colour: colourOption === "Select one" ? "" : colourOption,
      markings: markings,
      status: statusOption === "Select one" ? "" : statusOption,
      sterilisedStatus: sterilisationStatusOption === "Select one" ? "" : sterilisationStatusOption,
      sterilisedRequested: sterilisationRequestedOption === "Select one" ? "" : sterilisationRequestedOption,
      sterilisedRequestSigned: sterilisationRequestSignedOption === "Select one" ? "" : sterilisationRequestSignedOption,
      sterilisationOutcome: sterilisationOutcomeOption === "Select one" ? "" : sterilisationOutcomeOption,
      vaccinationShot1: vaccinationShot1Option === "Select one" ? "" : vaccinationShot1Option,
      vaccinationShot2: vaccinationShot2Option === "Select one" ? "" : vaccinationShot2Option,
      vaccinationShot3: vaccinationShot3Option === "Select one" ? "" : vaccinationShot3Option,
      lastDeWorming: lastDeworming ?? new Date(),
      membership: membershipTypeOption === "Select one" ? "" : membershipTypeOption,
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
  };

  //-------------------------------VIEW PROFILE PAGE-----------------------------------------
  const [isViewProfilePage, setIsViewProfilePage] = useState(false);
  const handleViewProfilePage = async (id: number) => {
    setIsViewProfilePage(true);
    setID(id);

    console.log("View profile page: ", JSON.stringify(user.data));
    if (user.data) {
      // Assuming userQuery.data contains the user object
      const userData = user.data.pet_data;
      //Get all the clinic dates and put in a string array
      const clinicData = user.data.clinic_data;
      const clinicDates =
        clinicData?.map(
          (clinic) =>
            clinic.clinic.date.getDate().toString() +
            "/" +
            ((clinic.clinic.date.getMonth() ?? 0) + 1).toString() +
            "/" +
            clinic.clinic.date.getFullYear().toString(),
        ) ?? [];
      const clinicIDs = clinicData?.map((clinic) => clinic.clinicID) ?? [];
      setPetName(userData?.petName ?? "");
      setSpeciesOption(userData?.species ?? "");
      setSexOption(userData?.sex ?? "");
      setAgeOption(userData?.age ?? "");
      setBreedOption(userData?.breed ?? "");
      setColourOption(userData?.colour ?? "");
      setMarkings(userData?.markings ?? "");
      setStatusOption(userData?.status ?? "");
      setSterilisationStatusOption(userData?.sterilisedStatus ?? "");
      setSterilisationRequestedOption(userData?.sterilisedRequested ?? "");
      setSterilisationOutcomeOption(userData?.sterilisationOutcome ?? "");
      setVaccinationShot1Option(userData?.vaccinationShot1 ?? "");
      setVaccinationShot2Option(userData?.vaccinationShot2 ?? "");
      setVaccinationShot3Option(userData?.vaccinationShot3 ?? "");
      setMembershipTypeOption(userData?.membership ?? "");
      setCardStatusOption(userData?.cardStatus ?? "");
      setKennelList(userData?.kennelReceived ?? []);
      setLastDeworming(userData?.lastDeworming ?? new Date());
      setComments(userData?.comments ?? "");
      setClinicList(clinicDates ?? []);
      setClinicIDList(clinicIDs ?? []);
    }

    setIsUpdate(false);
    setIsCreate(false);
    setIsViewProfilePage(true);
  };

  useEffect(() => {
    //console.log("View profile page: ", JSON.stringify(user.data));
    if (user.data) {
      const userData = user.data.pet_data;
      //Get all the clinic dates and put in a string array
      const clinicData = user.data.clinic_data;
      const clinicDates =
        clinicData?.map(
          (clinic) =>
            clinic.clinic.date.getDate().toString() +
            "/" +
            ((clinic.clinic.date.getMonth() ?? 0) + 1).toString() +
            "/" +
            clinic.clinic.date.getFullYear().toString(),
        ) ?? [];
      const clinicIDs = clinicData?.map((clinic) => clinic.clinicID) ?? [];
      setPetName(userData?.petName ?? "");
      setSpeciesOption(userData?.species ?? "");
      setSexOption(userData?.sex ?? "");
      setAgeOption(userData?.age ?? "");
      setBreedOption(userData?.breed ?? "");
      setColourOption(userData?.colour ?? "");
      setMarkings(userData?.markings ?? "");
      setStatusOption(userData?.status ?? "");
      setSterilisationStatusOption(userData?.sterilisedStatus ?? "");
      setSterilisationRequestedOption(userData?.sterilisedRequested ?? "");
      setSterilisationOutcomeOption(userData?.sterilisationOutcome ?? "");
      setVaccinationShot1Option(userData?.vaccinationShot1 ?? "");
      setVaccinationShot2Option(userData?.vaccinationShot2 ?? "");
      setVaccinationShot3Option(userData?.vaccinationShot3 ?? "");
      setMembershipTypeOption(userData?.membership ?? "");
      setCardStatusOption(userData?.cardStatus ?? "");
      setKennelList(userData?.kennelReceived ?? []);
      setComments(userData?.comments ?? "");
      setClinicList(clinicDates ?? []);
      setClinicIDList(clinicIDs ?? []);
    }
  }, [isViewProfilePage, user.data]); // Effect runs when userQuery.data changes

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
    if (Number(router.asPath.split("=")[1]) != 0 && isCreate) {
      await router.push(`/owner`);
    }

    setIsUpdate(false);
    setIsCreate(false);
    setIsViewProfilePage(false);
    setIsUploadModalOpen(false);
    setID(0);
    setPetName("");
    setSpeciesOption("Select one");
    setSexOption("Select one");
    setAgeOption("Select one");
    setBreedOption("Select one");
    setColourOption("Select one");
    setMarkings("");
    setStatusOption("Select one");
    setSterilisationStatusOption("Select one");
    setSterilisationRequestedOption("Select one");
    setSterilisationOutcomeOption("Select one");
    setVaccinationShot1Option("Select one");
    setVaccinationShot2Option("Select one");
    setVaccinationShot3Option("Select one");
    setMembershipTypeOption("Select one");
    setCardStatusOption("Select one");
    setKennelsReceivedOption("Select one");
    setComments("");
    setClinicList([]);
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

    if (petName === "") mandatoryFields.push("Pet Name");
    if (speciesOption === "Select one") mandatoryFields.push("Species");
    if (sexOption === "Select one") mandatoryFields.push("Sex");
    if (ageOption === "Select one") mandatoryFields.push("Age");
    if (breedOption === "Select one") mandatoryFields.push("Breed");
    // if (colourOption === "Select one") mandatoryFields.push("Colour");
    // if (markings === "") mandatoryFields.push("Markings");
    if (statusOption === "Select one") mandatoryFields.push("Status");
    if (sterilisationStatusOption === "Select one") mandatoryFields.push("Sterilisation Status");
    //  if (sterilisationRequestedOption === "Select one") mandatoryFields.push("Sterilisation Requested");
    // if (sterilisationOutcomeOption === "Select one") mandatoryFields.push("Sterilisation Outcome");
    //if (vaccinationShot1Option === "Select one") mandatoryFields.push("Vaccination Shot 1");
    //if (vaccinationShot2Option === "Select one") mandatoryFields.push("Vaccination Shot 2");
    //if (vaccinationShot3Option === "Select one") mandatoryFields.push("Vaccination Shot 3");
    if (membershipTypeOption === "Select one") mandatoryFields.push("Membership Type");
    // if (kennelsReceivedOption === "Select one") mandatoryFields.push("Kennels Received");

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
      void user.refetch();
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

  //-------------------------------INFINITE SCROLLING WITH INTERSECTION OBSERVER-----------------------------------------
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
        console.log("Next Cursor: " + lastPage.nextCursor);
        return lastPage.nextCursor;
      },
      enabled: false,
    },
  );

  //Flattens the pages array into one array
  const user_data = queryData?.pages.flatMap((page) => page.user_data);
  const owner_data = queryData?.pages.flatMap((page) => page.owner_data);
  const clinic_data = queryData?.pages.flatMap((page) => page.clinic_data);
  const treatment_data = queryData?.pages.flatMap((page) => page.treatment_data);
  //combine the following two objects into one object
  //const pet_data = user_data?.map((user, index) => ({ ...user, ...owner_data?.[index] }));

  // Assuming each user object contains an ownerId or similar property to relate to the owner
  const pet_data = user_data?.map((user) => {
    // Find the owner that matches the user's ownerId
    const owner = owner_data?.find((o) => o.ownerID === user.ownerID);
    // Combine the user data with the found owner data
    return { ...user, ...owner };
  });

  const pet_data_with_clinics = pet_data?.map((pet) => {
    // Assuming each clinic object has a 'petID' that links it to a pet
    const associatedClinics = clinic_data?.filter((clinic) => clinic.petID === pet.petID);

    return {
      ...pet,
      clinics: associatedClinics,
    };
  });

  const pet_data_with_clinics_and_treatments = pet_data_with_clinics?.map((pet) => {
    // Assuming each treatment object has a 'petID' that links it to a pet
    const associatedTreatments = treatment_data?.filter((treatment) => treatment.petID === pet.petID);

    return {
      ...pet,
      treatment: associatedTreatments,
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
  }, [fetchNextPage, hasNextPage, observerTarget]);

  //Make it retrieve the data from table again when table is reordered or queried or the user is updated, deleted or created
  useEffect(() => {
    void refetch();
  }, [isUpdate, isDeleted, isCreate, query, order, clinicIDList, clinicList]);

  //------------------------------------CREATE A NEW TREATMENT FOR PET--------------------------------------
  //When button is pressed the browser needs to go to the treatment's page. The treatment's page needs to know the pet's ID
  const handleCreateNewTreatment = async (id: number) => {
    await router.push({
      pathname: "/treatment",
      query: { petID: id },
    });
  };

  //------------------------------------ADD AN EXISTING CLINIC FOR PET--------------------------------------
  //Search for a clinic date and clinic ID given today's date. Todays date needs to match up with the clinic date for the clinic to be added to the pet
  const handleAddClinic = async (id: number) => {
    //get today's date
    const today = new Date();
    //add to the clinic list and ID list and then add it to the table
    //check if the clinic date is today's date
    const option = clinicsAttendedOptions.find(
      (clinic) => clinic.date.getDate() === today.getDate() && clinic.date.getMonth() === today.getMonth() && clinic.date.getFullYear() === today.getFullYear(),
    );
    console.log("Option for clinic exists: ", option);
    const optionDate = option?.date.getDate().toString() + "/" + option?.date.getMonth().toString() + "/" + option?.date.getFullYear().toString();
    const optionID = option?.clinicID ?? 0;

    if (!clinicIDList.includes(optionID) && optionID != 0) {
      setClinicList([...clinicList, String(optionDate)]);
      setClinicIDList([...clinicIDList, optionID]);

      //update the pet table to add the clinic to the pet
      await addClinic.mutateAsync({
        petID: id,
        clinicID: optionID,
      });
    }
  };

  return (
    <>
      <Head>
        <title>Pet Profiles</title>
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
              <div className="relative flex justify-center">
                <input
                  className="mt-3 flex w-1/3 rounded-lg border-2 border-zinc-800 px-2"
                  placeholder="Search..."
                  onChange={(e) => setQuery(getQueryFromSearchPhrase(e.target.value))}
                />

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
                        <button className={`${order == "petName" ? "underline" : ""}`} onClick={() => handleOrderFields("petName")}>
                          Pet Name
                        </button>
                      </th>
                      <th className="px-4 py-2">Owner</th>

                      <th className="px-4 py-2">Greater Area</th>
                      <th className="px-4 py-2">Area</th>
                      <th className="px-4 py-2">Address</th>
                      <th className="px-4 py-2">Sterilised</th>
                      <th className="px-4 py-2">Last Treatment</th>
                      <th className="px-4 py-2">Last Clinic</th>
                      {/* <th className="px-4 py-2">Last Treatment</th> */}
                      <th className="px-4 py-2">
                        <button className={`${order == "updatedAt" ? "underline" : ""}`} onClick={() => handleOrderFields("updatedAt")}>
                          Last update
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pet_data_with_clinics_and_treatments?.map((pet, index) => {
                      return (
                        <tr className="items-center">
                          <div className="px-4 py-2">{index + 1}</div>
                          <td className="border px-4 py-2">
                            {pet.petName} ({pet.species === "Cat" ? "Cat" : pet.breed})
                          </td>
                          <td className="border px-4 py-2">
                            {pet.firstName} {pet.surname} ({pet.ownerID})
                          </td>

                          <td className="border px-4 py-2">{pet.addressGreaterArea}</td>
                          <td className="border px-4 py-2">{pet.addressArea}</td>
                          <td className="border px-4 py-2">
                            {pet.addressStreetNumber} {pet.addressStreet}
                          </td>
                          <td className="border px-4 py-2">{pet.sterilisedStatus}</td>
                          <td className="border px-4 py-2">
                            {pet.treatment && pet.treatment.length > 0 ? (
                              <>
                                {pet?.treatment?.[pet?.treatment.length - 1]?.date.getDate().toString()}/
                                {((pet?.treatment?.[pet?.treatment.length - 1]?.date.getMonth() ?? 0) + 1).toString()}/
                                {pet?.treatment?.[pet?.treatment.length - 1]?.date.getFullYear().toString()}
                              </>
                            ) : (
                              "None"
                            )}
                          </td>

                          <td className="border px-4 py-2">
                            {pet.clinics && pet.clinics.length > 0 ? (
                              <>
                                {pet?.clinics?.[pet?.clinics.length - 1]?.clinic?.date.getDate().toString()}/
                                {((pet?.clinics?.[pet?.clinics.length - 1]?.clinic?.date.getMonth() ?? 0) + 1).toString()}/
                                {pet?.clinics?.[pet?.clinics.length - 1]?.clinic?.date.getFullYear().toString()}
                              </>
                            ) : (
                              "None"
                            )}
                          </td>

                          <td className="border px-4 py-2">
                            {pet?.updatedAt?.getDate()?.toString() ?? ""}
                            {"/"}
                            {((pet?.updatedAt?.getMonth() ?? 0) + 1)?.toString() ?? ""}
                            {"/"}
                            {pet?.updatedAt?.getFullYear()?.toString() ?? ""}
                          </td>
                          <div className="flex">
                            <Trash
                              size={24}
                              className="mx-2 my-3 rounded-lg hover:bg-orange-200"
                              onClick={() => handleDeleteModal(pet.petID, String(pet.petID), pet.petName ?? "")}
                            />
                            <Pencil size={24} className="mx-2 my-3 rounded-lg hover:bg-orange-200" onClick={() => handleUpdateUserProfile(pet.petID)} />
                            <AddressBook size={24} className="mx-2 my-3 rounded-lg hover:bg-orange-200" onClick={() => handleViewProfilePage(pet.petID)} />
                            <FirstAidKit size={24} className="mx-2 my-3 rounded-lg hover:bg-orange-200" onClick={() => handleCreateNewTreatment(pet.petID)} />
                            <Bed size={24} className="mx-2 my-3 rounded-lg hover:bg-orange-200" onClick={() => handleAddClinic(pet.petID)} />
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
                <b className=" text-2xl">{isUpdate ? "Update Pet Data" : "Add New Pet"}</b>
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
              <div className="flex w-[46%] flex-col items-start">
                {/*<div className="p-2">User ID: {(lastUserCreated?.data?.userID ?? 1000000) + 1}</div>*/}
                <div className="relative my-2 flex w-full flex-col rounded-lg border-2 bg-slate-200 p-4">
                  <b className="mb-3 text-center text-xl">Pet Identification Data</b>
                  {isUpdate && (
                    <div className={`absolute ${user.data?.pet_data?.image ? "right-12" : "right-8"} top-16`}>
                      {user.data?.pet_data?.image ? (
                        <Image
                          src={user.data?.pet_data?.image}
                          alt="Afripaw profile pic"
                          className="ml-auto aspect-auto max-h-40 max-w-[7rem]"
                          width={140}
                          height={160}
                        />
                      ) : (
                        <UserCircle size={140} className="ml-auto aspect-auto max-h-52 max-w-[9rem] border-2" />
                      )}
                    </div>
                  )}
                  {isUpdate && (
                    <UploadButton
                      className="absolute right-8 top-60 ut-button:bg-main-orange ut-button:focus:bg-orange-500 ut-button:active:bg-orange-500 ut-button:disabled:bg-orange-500 ut-label:hover:bg-orange-500"
                      endpoint="imageUploader"
                      input={{ userId: String(user.data?.pet_data?.petID) ?? "", user: "pet" }}
                      onUploadError={(error: Error) => {
                        // Do something with the error.
                        alert(`ERROR! ${error.message}`);
                      }}
                      onClientUploadComplete={() => {
                        void user.refetch();
                      }}
                    />
                  )}

                  <Input label="Pet Name" placeholder="Type here: e.g. Sally" value={petName} onChange={setPetName} required />

                  <div className="flex items-start">
                    <div className="mr-3 flex items-center pt-5">
                      <div className=" flex">
                        Species<div className="text-lg text-main-orange">*</div>:{" "}
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <button
                        ref={btnSpeciesRef}
                        className="my-3 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                        type="button"
                        onClick={handleToggleSpecies}
                      >
                        {speciesOption + " "}
                        <svg className="ms-3 h-2.5 w-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                        </svg>
                      </button>
                      {isSpeciesOpen && (
                        <div ref={speciesRef} className="z-10 w-44 divide-y divide-gray-100 rounded-lg bg-white shadow dark:bg-gray-700">
                          <ul className="py-2 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdownHoverButton">
                            {speciesOptions.map((option) => (
                              <li key={option} onClick={() => handleSpeciesOption(option)}>
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
                      <div className=" flex">
                        Sex<div className="text-lg text-main-orange">*</div>:{" "}
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <button
                        ref={btnSexRef}
                        className="my-3 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                        type="button"
                        onClick={handleToggleSex}
                      >
                        {sexOption + " "}
                        <svg className="ms-3 h-2.5 w-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                        </svg>
                      </button>
                      {isSexOpen && (
                        <div ref={sexRef} className="z-10 w-44 divide-y divide-gray-100 rounded-lg bg-white shadow dark:bg-gray-700">
                          <ul className="py-2 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdownHoverButton">
                            {sexOptions.map((option) => (
                              <li key={option} onClick={() => handleSexOption(option)}>
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
                      <div className=" flex">
                        Age Category<div className="text-lg text-main-orange">*</div>:{" "}
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <button
                        ref={btnAgeRef}
                        className="my-3 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                        type="button"
                        onClick={handleToggleAge}
                      >
                        {ageOption + " "}
                        <svg className="ms-3 h-2.5 w-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                        </svg>
                      </button>
                      {isAgeOpen && (
                        <div ref={ageRef} className="z-10 w-44 divide-y divide-gray-100 rounded-lg bg-white shadow dark:bg-gray-700">
                          <ul className="py-2 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdownHoverButton">
                            {ageOptions.map((option) => (
                              <li key={option} onClick={() => handleAgeOption(option)}>
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
                      <div className=" flex">
                        Breed<div className="text-lg text-main-orange">*</div>:{" "}
                      </div>
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
                  </div>

                  <div className="flex items-start">
                    <div className="mr-3 flex items-center pt-5">
                      <div className=" flex">Colour: </div>
                    </div>
                    <div className="flex flex-col">
                      <button
                        ref={btnColourRef}
                        className="my-3 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                        type="button"
                        onClick={handleToggleColour}
                      >
                        {colourOption + " "}
                        <svg className="ms-3 h-2.5 w-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                        </svg>
                      </button>
                      {isColourOpen && (
                        <div ref={colourRef} className="z-10 w-44 divide-y divide-gray-100 rounded-lg bg-white shadow dark:bg-gray-700">
                          <ul className="py-2 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdownHoverButton">
                            {colourOptions.map((option) => (
                              <li key={option} onClick={() => handleColourOption(option)}>
                                <button className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">{option}</button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="w-36 pt-3">Markings: </div>

                    <textarea
                      className="m-2 h-24 w-full rounded-lg border-2 border-slate-300 px-2 focus:border-black"
                      placeholder="Type here: e.g. White fur with dark spot on the left side of the face"
                      onChange={(e) => setMarkings(e.target.value)}
                      value={markings}
                    />
                  </div>
                </div>

                <div className="my-2 flex w-full flex-col rounded-lg border-2 bg-slate-200 p-4">
                  <b className="mb-3 text-center text-xl">Pet Health Data</b>

                  <div className="flex items-start">
                    <div className="mr-3 flex items-center pt-5">
                      <div className=" flex">
                        Pet Status<div className="text-lg text-main-orange">*</div>:{" "}
                      </div>
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
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="mr-3 flex items-center pt-5">
                      <div className=" flex">
                        Sterilisation Status<div className="text-lg text-main-orange">*</div>:{" "}
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <button
                        ref={btnSterilisationStatusRef}
                        className="my-3 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                        type="button"
                        onClick={handleToggleSterilisationStatus}
                      >
                        {sterilisationStatusOption + " "}
                        <svg className="ms-3 h-2.5 w-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                        </svg>
                      </button>
                      {sterilisationStatus && (
                        <div ref={sterilisationStatusRef} className="z-10 w-44 divide-y divide-gray-100 rounded-lg bg-white shadow dark:bg-gray-700">
                          <ul className="py-2 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdownHoverButton">
                            {sterilisationStatusOptions.map((option) => (
                              <li key={option} onClick={() => handleSterilisationStatusOption(option)}>
                                <button className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">{option}</button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  {sterilisationStatusOption === "No" && (
                    <div className="flex items-start">
                      <div className="mr-3 flex items-center pt-5">
                        <div className=" flex">Sterilisation Requested?: </div>
                      </div>
                      <div className="flex flex-col">
                        <button
                          ref={btnSterilisationRequestedRef}
                          className="my-3 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                          type="button"
                          onClick={handleToggleSterilisationRequested}
                        >
                          {sterilisationRequestedOption + " "}
                          <svg className="ms-3 h-2.5 w-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                          </svg>
                        </button>
                        {sterilisationRequested && (
                          <div ref={sterilisationRequestedRef} className="z-10 w-44 divide-y divide-gray-100 rounded-lg bg-white shadow dark:bg-gray-700">
                            <ul className="py-2 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdownHoverButton">
                              {sterilisationRequestedOptions.map((option) => (
                                <li key={option} onClick={() => handleSterilisationRequestedOption(option)}>
                                  <button className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">{option}</button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {sterilisationRequestedOption === "Yes" && (
                    <div className="flex items-start">
                      <div className="mr-3 flex items-center pt-5">
                        <div className=" flex">Sterilisation Request Signed: </div>
                      </div>
                      <div className="flex flex-col">
                        <button
                          ref={btnSterilisationRequestSignedRef}
                          className="my-3 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                          type="button"
                          onClick={handleToggleSterilisationRequestSigned}
                        >
                          {sterilisationRequestSignedOption + " "}
                          <svg className="ms-3 h-2.5 w-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                          </svg>
                        </button>
                        {sterilisationRequestSigned && (
                          <div ref={sterilisationRequestSignedRef} className="z-10 w-44 divide-y divide-gray-100 rounded-lg bg-white shadow dark:bg-gray-700">
                            <ul className="py-2 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdownHoverButton">
                              {sterilisationRequestSignedOptions.map((option) => (
                                <li key={option} onClick={() => handleSterilisationRequestSignedOption(option)}>
                                  <button className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">{option}</button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {sterilisationStatusOption === "Yes" && sterilisationRequestSignedOption === "No" && (
                    <div className="flex items-start">
                      <div className="mr-3 flex items-center pt-5">
                        <div className=" flex">Sterilisation Outcome: </div>
                      </div>
                      <div className="flex flex-col">
                        <button
                          ref={btnSterilisationOutcomeRef}
                          className="my-3 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                          type="button"
                          onClick={handleToggleSterilisationOutcome}
                        >
                          {sterilisationOutcomeOption + " "}
                          <svg className="ms-3 h-2.5 w-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                          </svg>
                        </button>
                        {sterilisationOutcome && (
                          <div ref={sterilisationOutcomeRef} className="z-10 w-44 divide-y divide-gray-100 rounded-lg bg-white shadow dark:bg-gray-700">
                            <ul className="py-2 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdownHoverButton">
                              {sterilisationOutcomeOptions.map((option) => (
                                <li key={option} onClick={() => handleSterilisationOutcomeOption(option)}>
                                  <button className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">{option}</button>
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
                  <b className="mb-3 text-center text-xl">Afripaw Association Data</b>

                  {/*Clinics attended*/}
                  <div className="flex items-start">
                    <div className="mr-3 flex items-center pt-5">
                      <div className=" flex">Clinics Attended: ({clinicList.length}) </div>
                    </div>
                    {/*Show list of all the clinics attended */}
                    <div className="flex flex-col items-center">
                      <button
                        onClick={handleShowClinicsAttended}
                        className="mb-2 mr-3 mt-3 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                      >
                        Show all clinics attended
                      </button>
                      {showClinicsAttended && (
                        <ul className="mr-3 w-full rounded-lg bg-white px-5 py-2 text-sm text-gray-700 dark:text-gray-200">
                          {clinicList.map((clinic) => (
                            <li key={clinic} className=" py-2">
                              {clinic}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="flex flex-col">
                      <button
                        ref={btnClinicsAttendedRef}
                        className="my-3 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                        type="button"
                        onClick={handleToggleClinicsAttended}
                      >
                        {clinicsAttendedOption + " "}
                        <svg className="ms-3 h-2.5 w-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                        </svg>
                      </button>
                      {clinicsAttended && (
                        <div ref={clinicsAttendedRef} className="z-10 w-44 divide-y divide-gray-100 rounded-lg bg-white shadow dark:bg-gray-700">
                          <ul className="py-2 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdownHoverButton">
                            {clinicsAttendedOptions.map((option) => (
                              <li
                                key={
                                  option.date.getDate().toString() +
                                  "/" +
                                  ((option.date.getMonth() ?? 0) + 1).toString() +
                                  "/" +
                                  option.date.getFullYear().toString()
                                }
                                onClick={() =>
                                  handleClinicsAttendedOption(
                                    option.date.getDate().toString() +
                                      "/" +
                                      ((option.date.getMonth() ?? 0) + 1).toString() +
                                      "/" +
                                      option.date.getFullYear().toString(),
                                    option.clinicID,
                                  )
                                }
                              >
                                <button className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">
                                  {option.date.getDate().toString() +
                                    "/" +
                                    ((option.date.getMonth() ?? 0) + 1).toString() +
                                    "/" +
                                    option.date.getFullYear().toString()}
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  {/*LAST DEWORMING*/}
                  <div className="flex items-center">
                    <div className=" flex">
                      Last Deworming<div className="text-lg text-main-orange">*</div>:{" "}
                    </div>
                    <div className="p-4">
                      <DatePicker
                        selected={lastDeworming}
                        onChange={(date) => setLastDeworming(date!)}
                        dateFormat="dd/MM/yyyy"
                        customInput={<CustomInput />}
                        className="form-input rounded-md border px-4 py-2"
                      />
                    </div>
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
                    <div className="mr-3 flex items-center pt-5">
                      <div className=" flex">
                        Membership Type<div className="text-lg text-main-orange">*</div>:{" "}
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <button
                        ref={btnMembershipTypeRef}
                        className="my-3 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                        type="button"
                        onClick={handleToggleMembershipType}
                      >
                        {membershipTypeOption + " "}
                        <svg className="ms-3 h-2.5 w-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                        </svg>
                      </button>
                      {membershipType && (
                        <div ref={membershipTypeRef} className="z-10 w-44 divide-y divide-gray-100 rounded-lg bg-white shadow dark:bg-gray-700">
                          <ul className="py-2 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdownHoverButton">
                            {membershipTypeOptions.map((option) => (
                              <li key={option} onClick={() => handleMembershipTypeOption(option)}>
                                <button className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">{option}</button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  {membershipTypeOption != "Non-card holder" && (
                    <div className="flex items-start">
                      <div className="mr-3 flex items-center pt-5">
                        <div className=" flex">Card Status: </div>
                      </div>
                      <div className="flex flex-col">
                        <button
                          ref={btnCardStatusRef}
                          className="my-3 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                          type="button"
                          onClick={handleToggleCardStatus}
                        >
                          {cardStatusOption + " "}
                          <svg className="ms-3 h-2.5 w-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                          </svg>
                        </button>
                        {cardStatus && (
                          <div ref={cardStatusRef} className="z-10 w-44 divide-y divide-gray-100 rounded-lg bg-white shadow dark:bg-gray-700">
                            <ul className="py-2 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdownHoverButton">
                              {cardStatusOptions.map((option) => (
                                <li key={option} onClick={() => handleCardStatusOption(option)}>
                                  <button className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">{option}</button>
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
                      <div className=" flex">Kennels Received: ({kennelList.length}) </div>
                    </div>

                    <div className="flex flex-col items-center">
                      <button
                        onClick={handleShowKennelsReceived}
                        className="mb-2 mr-3 mt-3 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                      >
                        Show all kennels received
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
                    </div>

                    <div className="flex flex-col">
                      <button
                        ref={btnKennelsReceivedRef}
                        className="my-3 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                        type="button"
                        onClick={handleToggleKennelsReceived}
                      >
                        {kennelsReceivedOption + " "}
                        <svg className="ms-3 h-2.5 w-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                        </svg>
                      </button>
                      {kennelsReceived && (
                        <div ref={kennelsReceivedRef} className="z-10 w-44 divide-y divide-gray-100 rounded-lg bg-white shadow dark:bg-gray-700">
                          <ul className="py-2 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdownHoverButton">
                            {kennelsReceivedOptions.map((option) => (
                              <li key={option} onClick={() => handleKennelsReceivedOption(option)}>
                                <button className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">{option}</button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
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
                {isUpdate ? "Update" : "Create"}
              </button>
            </div>
          </>
        )}

        {isViewProfilePage && (
          <>
            <div className="flex justify-center">
              <div className="relative mb-4 flex grow flex-col items-center rounded-lg bg-slate-200 px-5 py-6">
                <div className=" text-2xl">Pet Profile</div>
                <div className="flex justify-center">
                  <button className="absolute right-0 top-0 m-3 rounded-lg bg-main-orange p-3 text-white hover:bg-orange-500" onClick={handleBackButton}>
                    Back
                  </button>
                </div>
              </div>
            </div>
            <div ref={printComponentRef} className="flex grow flex-col items-center">
              <div className="mt-6 flex w-[40%] min-w-[38rem] max-w-xl flex-col items-start">
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
                    {user.data?.pet_data?.image ? (
                      <Image
                        src={user.data?.pet_data?.image}
                        alt="Afripaw profile pic"
                        className="ml-auto aspect-auto max-h-52 max-w-[9rem]"
                        width={150}
                        height={200}
                      />
                    ) : (
                      <UserCircle size={140} className="ml-auto aspect-auto" />
                    )}
                  </div>
                  <b className="mb-14 text-center text-xl">Pet Identification Data</b>
                  <div className="mb-2 flex items-center">
                    <b className="mr-3">Pet ID:</b> {user?.data?.pet_data?.petID}
                  </div>

                  <div className="mb-2 flex items-center">
                    <b className="mr-3">Pet name:</b> {petName}
                  </div>

                  <div className="mb-2 flex items-center">
                    <b className="mr-3">Species:</b> {speciesOption}
                  </div>

                  <div className="mb-2 flex items-center">
                    <b className="mr-3">Sex:</b> {sexOption}
                  </div>

                  <div className="mb-2 flex items-center">
                    <b className="mr-3">Age:</b> {ageOption}
                  </div>

                  <div className="mb-2 flex items-center">
                    <b className="mr-3">Breed:</b> {breedOption}
                  </div>

                  <div className="mb-2 flex items-center">
                    <b className="mr-3">Colour:</b> {colourOption}
                  </div>

                  <div className="mb-2 flex items-center">
                    <b className="mr-3">Markings:</b> {markings}
                  </div>
                </div>

                <div className="my-2 flex w-full flex-col rounded-lg border-2 bg-slate-200 p-4">
                  <b className="mb-3 text-center text-xl">Pet Health Data</b>

                  <div className="mb-2 flex items-center">
                    <b className="mr-3">Pet Status:</b> {statusOption}
                  </div>

                  <div className="mb-2 flex items-center">
                    <b className="mr-3">Sterilisation Status:</b> {sterilisationStatusOption}
                  </div>

                  <div className="mb-2 flex items-center">
                    <b className="mr-3">Sterilisation Requested:</b> {sterilisationRequestedOption}
                  </div>

                  <div className="mb-2 flex items-center">
                    <b className="mr-3">Sterilisation Request Signed:</b> {sterilisationRequestSignedOption}
                  </div>

                  <div className="mb-2 flex items-center">
                    <b className="mr-3">Sterilisation Outcome:</b> {sterilisationOutcomeOption}
                  </div>
                </div>

                <div className="my-2 flex w-full flex-col rounded-lg border-2 bg-slate-200 p-4">
                  <b className="mb-3 text-center text-xl">Afripaw Association Data</b>

                  <div className="mb-2 flex items-center">
                    <b className="mr-3">Clinics Attended:</b> {clinicList.map((clinic, index) => (clinicList.length - 1 == index ? clinic : clinic + ", "))}
                  </div>

                  <div className="mb-2 flex items-center">
                    <b className="mr-3">Membership Type:</b> {membershipTypeOption}
                  </div>

                  <div className="mb-2 flex items-center">
                    <b className="mr-3">Card Status:</b> {cardStatusOption}
                  </div>

                  <div className="mb-2 flex items-center">
                    <b className="mr-3">Kennels Received:</b> {kennelList.map((kennel, index) => (kennelList.length - 1 == index ? kennel : kennel + ", "))}
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

export default Pet;
