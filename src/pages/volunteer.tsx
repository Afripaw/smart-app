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

//Icons
import { AddressBook, Pencil, Printer, Trash, UserCircle, Users, Bed } from "phosphor-react";

//Date picker
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { UploadButton } from "~/utils/uploadthing";
import { useSession } from "next-auth/react";
import Input from "~/components/Base/Input";
import { bg } from "date-fns/locale";
import { set } from "date-fns";

const Volunteer: NextPage = () => {
  useSession({ required: true });

  const newVolunteer = api.volunteer.create.useMutation();
  const updateVolunteer = api.volunteer.update.useMutation();
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

  //-------------------------------CLINICS ATTENDED-----------------------------------------
  //The list of clinics that the user has attended
  const [clinicList, setClinicList] = useState<string[]>([]);
  const [clinicIDList, setClinicIDList] = useState<number[]>([]);

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
  const volunteer_data_with_clinics = user_data?.map((volunteer) => {
    // Assuming each clinic object has a 'petID' that links it to a pet
    const associatedClinics = clinics_data?.filter((clinic) => clinic.volunteerID === volunteer.volunteerID);

    return {
      ...volunteer,
      clinics: associatedClinics,
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

  //Make it retrieve the data from tab;e again when the user is updated, deleted or created
  useEffect(() => {
    void refetch();
  }, [isUpdate, isDeleted, isCreate, query, order, isViewProfilePage, clinicList, clinicIDList]);

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
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [street, setStreet] = useState("");
  const [addressFreeForm, setAddressFreeForm] = useState("");
  const [addressStreetCode, setAddressStreetCode] = useState("");
  const [addressStreetNumber, setAddressStreetNumber] = useState("");
  const [addressSuburb, setAddressSuburb] = useState("");
  const [addressPostalCode, setAddressPostalCode] = useState("");
  const [comments, setComments] = useState("");
  const [startingDate, setStartingDate] = useState(new Date());
  const [image, setImage] = useState("");

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
  const [greaterAreaOption, setGreaterAreaOption] = useState("Select one");
  const greaterAreaRef = useRef<HTMLDivElement>(null);
  const btnGreaterAreaRef = useRef<HTMLButtonElement>(null);

  const [preferredCommunication, setPreferredCommunication] = useState(false);
  const [preferredOption, setPreferredCommunicationOption] = useState("Select one");
  const preferredCommunicationRef = useRef<HTMLDivElement>(null);
  const btnPreferredCommunicationRef = useRef<HTMLButtonElement>(null);

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

  const [preferredCommunicationOptions, setPreferredCommunicationOptions] = useState(["SMS"]);
  useEffect(() => {
    if (email === "") {
      setPreferredCommunicationOptions(["SMS"]);
    } else if (email != "") {
      setPreferredCommunicationOptions(["Email", "SMS"]);
    }
  }, [email]);

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

  //CLINICSATTENDED
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

  const handleClinicsAttendedOption = (option: SetStateAction<string>, optionID: number) => {
    setClinicsAttendedOption(option);
    setClinicsAttended(false);
    setShowClinicsAttended(false);
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

      //Get all the clinic dates and put in a string array
      const clinicData = user?.clinics;
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

      setFirstName(userData.firstName ?? "");
      setSurname(userData.surname ?? "");
      setEmail(userData.email ?? "");
      setMobile(userData.mobile ?? "");
      setGreaterAreaOption(userData.addressGreaterArea ?? "Select one");
      setStreet(userData.addressStreet ?? "");
      setAddressStreetCode(userData.addressStreetCode ?? "");
      setAddressStreetNumber(userData.addressStreetNumber ?? "");
      setAddressSuburb(userData.addressSuburb ?? "");
      setAddressPostalCode(userData.addressPostalCode ?? "");
      setPreferredCommunicationOption(userData.preferredCommunication ?? "Select one");
      setStartingDate(userData.startingDate ?? new Date());
      setStatusOption(userData.status ?? "Select one");
      setComments(userData.comments ?? "");
      setClinicList(clinicDates);
      setClinicIDList(clinicIDs);
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
      //Get all the clinic dates and put in a string array
      const clinicData = user?.clinics;
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
      setFirstName(userData.firstName ?? "");
      setSurname(userData.surname ?? "");
      setEmail(userData.email ?? "");
      setMobile(userData.mobile ?? "");
      setGreaterAreaOption(userData.addressGreaterArea ?? "Select one");
      setStreet(userData.addressStreet ?? "");
      setAddressFreeForm(userData.addressFreeForm ?? "");
      setAddressStreetCode(userData.addressStreetCode ?? "");
      setAddressStreetNumber(userData.addressStreetNumber ?? "");
      setAddressSuburb(userData.addressSuburb ?? "");
      setAddressPostalCode(userData.addressPostalCode ?? "");
      setPreferredCommunicationOption(userData.preferredCommunication ?? "Select one");
      setStartingDate(userData.startingDate ?? new Date());
      setStatusOption(userData.status ?? "Select one");
      setComments(userData.comments ?? "");
      setClinicList(clinicDates);
      setClinicIDList(clinicIDs);
      // setClinicList(userData.clinicsAttended ?? []);
    }
  }, [isUpdate, isCreate]); // Effect runs when userQuery.data changes

  const handleUpdateUser = async () => {
    await updateVolunteer.mutateAsync({
      volunteerID: id,
      firstName: firstName,
      email: email,
      surname: surname,
      mobile: mobile,
      addressGreaterArea: greaterAreaOption === "Select one" ? "" : greaterAreaOption,
      addressStreet: street,
      addressStreetCode: addressStreetCode,
      addressStreetNumber: addressStreetNumber,
      addressSuburb: addressSuburb,
      addressPostalCode: addressPostalCode,
      addressFreeForm: addressFreeForm,
      preferredCommunication: preferredOption === "Select one" ? "" : preferredOption,
      startingDate: startingDate,
      status: statusOption === "Select one" ? "" : statusOption,
      clinicAttended: clinicIDList,
      comments: comments,
    });
    //After the newUser has been created make sure to set the fields back to empty
    setFirstName("");
    setEmail("");
    setSurname("");
    setMobile("");
    setGreaterAreaOption("Select one");
    setStreet("");
    setAddressStreetCode("");
    setAddressStreetNumber("");
    setAddressSuburb("");
    setAddressPostalCode("");
    setAddressFreeForm("");
    setPreferredCommunicationOption("Select one");
    setStatusOption("Select one");
    setComments("");
    setClinicList([]);
    setIsUpdate(false);
    setIsCreate(false);
  };

  //-------------------------------CREATE NEW USER-----------------------------------------

  const handleCreateNewUser = async () => {
    setGreaterAreaOption("Select one");
    setStreet("");
    setPreferredCommunicationOption("Select one");
    setStatusOption("Select one");
    setStartingDate(new Date());
    setComments("");
    setFirstName("");
    setEmail("");
    setSurname("");
    setMobile("");
    setAddressStreetCode("");
    setAddressStreetNumber("");
    setAddressSuburb("");
    setAddressPostalCode("");
    setAddressFreeForm("");
    //isCreate ? setIsCreate(false) : setIsCreate(true);
    setClinicList([]);
    setClinicIDList([]);
    setIsCreate(true);
    setIsUpdate(false);
  };
  //-------------------------------NEW USER-----------------------------------------

  const handleNewUser = async () => {
    const newUser_ = await newVolunteer.mutateAsync({
      firstName: firstName,
      email: email,
      surname: surname,
      mobile: mobile,
      addressGreaterArea: greaterAreaOption === "Select one" ? "" : greaterAreaOption,
      addressStreet: street,
      addressStreetCode: addressStreetCode,
      addressStreetNumber: addressStreetNumber,
      addressSuburb: addressSuburb,
      addressPostalCode: addressPostalCode,
      addressFreeForm: addressFreeForm,
      preferredCommunication: preferredOption === "Select one" ? "" : preferredOption,
      startingDate: startingDate,
      status: statusOption === "Select one" ? "" : statusOption,
      clinicAttended: clinicIDList,
      comments: comments,
    });

    //Image upload
    //console.log("ID: ", newUser_?.volunteerID, "Image: ", newUser_?.image, "Name: ", firstName, "IsUploadModalOpen: ", isUploadModalOpen);
    //console.log("Clinics attended: ", newUser_.clinicsAttended);
    handleUploadModal(newUser_.volunteerID, firstName, newUser_?.image ?? "");
    setIsCreate(false);
    setIsUpdate(false);

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
      setFirstName(userData.firstName ?? "");
      setSurname(userData.surname ?? "");
      setEmail(userData.email ?? "");
      setMobile(userData.mobile ?? "");
      setGreaterAreaOption(userData.addressGreaterArea ?? "");
      setStreet(userData.addressStreet ?? "");
      setAddressStreetCode(userData.addressStreetCode ?? "");
      setAddressStreetNumber(userData.addressStreetNumber ?? "");
      setAddressSuburb(userData.addressSuburb ?? "");
      setAddressPostalCode(userData.addressPostalCode ?? "");
      setAddressFreeForm(userData.addressFreeForm ?? "");
      setPreferredCommunicationOption(userData.preferredCommunication ?? "");
      setStartingDate(userData.startingDate ?? new Date());
      setStatusOption(userData.status ?? "");
      setComments(userData.comments ?? "");
      console.log("Select one");
      setClinicList(clinicDates);
      setClinicIDList(clinicIDs);
      //setClinicList(userData. ?? []);
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
      //Get all the clinic dates and put in a string array
      const clinicData = user?.clinics;
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
      setFirstName(userData.firstName ?? "");
      setSurname(userData.surname ?? "");
      setEmail(userData.email ?? "");
      setMobile(userData.mobile ?? "");
      setGreaterAreaOption(userData.addressGreaterArea ?? "");
      setStreet(userData.addressStreet ?? "");
      setAddressStreetCode(userData.addressStreetCode ?? "");
      setAddressStreetNumber(userData.addressStreetNumber ?? "");
      setAddressSuburb(userData.addressSuburb ?? "");
      setAddressPostalCode(userData.addressPostalCode ?? "");
      setPreferredCommunicationOption(userData.preferredCommunication ?? "");
      setStartingDate(userData.startingDate ?? new Date());
      setStatusOption(userData.status ?? "");
      setComments(userData.comments ?? "");
      setClinicList(clinicDates);
      setClinicIDList(clinicIDs);
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
    setIsUpdate(false);
    setIsCreate(false);
    setIsViewProfilePage(false);
    setIsUploadModalOpen(false);
    setID(0);
    setFirstName("");
    setEmail("");
    setSurname("");
    setMobile("");
    setGreaterAreaOption("Select one");
    setStreet("");
    setAddressStreetCode("");
    setAddressStreetNumber("");
    setAddressSuburb("");
    setAddressPostalCode("");
    setPreferredCommunicationOption("Select one");
    setStatusOption("Select one");
    setComments("");
    setClinicList([]);
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
    if (statusOption === "Select one") mandatoryFields.push("Status");
    if (startingDate === null) mandatoryFields.push("Starting Date");

    if (mobileMessage !== "") errorFields.push({ field: "Mobile", message: mobileMessage });
    //if (streetCodeMessage !== "") errorFields.push({ field: "Street Code", message: streetCodeMessage });
    if (streetNumberMessage !== "") errorFields.push({ field: "Street Number", message: streetNumberMessage });
    if (postalCodeMessage !== "") errorFields.push({ field: "Postal Code", message: postalCodeMessage });

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

  //------------------------------------ADD AN EXISTING CLINIC FOR VOLUNTEER--------------------------------------
  //Search for a clinic date and clinic ID given today's date. Todays date needs to match up with the clinic date for the clinic to be added to the volunteer
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
        volunteerID: id,
        clinicID: optionID,
      });
    }
  };

  return (
    <>
      <Head>
        <title>User Profiles</title>
      </Head>
      <main className="flex flex-col">
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
                  <input
                    className="mt-3 flex w-1/3 rounded-lg border-2 border-zinc-800 px-2"
                    placeholder="Search..."
                    onChange={(e) => setQuery(getQueryFromSearchPhrase(e.target.value))}
                  />
                  <button
                    className="absolute right-0 top-0 mx-3 mb-3 rounded-lg bg-main-orange p-3 text-white hover:bg-orange-500"
                    onClick={handleCreateNewUser}
                  >
                    Create new Volunteer
                  </button>
                  {/* <button className="absolute left-0 top-0 mx-3 mb-3 rounded-lg bg-main-orange p-3 hover:bg-orange-500" onClick={handleDeleteAllUsers}>
                    Delete all users
                  </button> */}
                </div>
              </div>
              <article className="my-6 flex max-h-[60%] w-full items-center justify-center overflow-auto rounded-md shadow-inner">
                <table className="table-auto">
                  <thead className="">
                    <tr>
                      <th className="px-4 py-2"></th>
                      <th className="px-4 py-2">ID</th>
                      <th className="px-4 py-2">Name</th>
                      <th className="px-4 py-2">
                        <button className={`${order == "surname" ? "underline" : ""}`} onClick={() => handleOrderFields("surname")}>
                          Surname
                        </button>
                      </th>
                      <th className="px-4 py-2">Email</th>
                      <th className="px-4 py-2">Mobile</th>
                      <th className="px-4 py-2">Greater Area</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="w-[35px] px-4 py-2">Last Clinic</th>
                      <th className="w-[35px] px-4 py-2">
                        <button className={`${order == "updatedAt" ? "underline" : ""}`} onClick={() => handleOrderFields("updatedAt")}>
                          Last update
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {volunteer_data_with_clinics?.map((user, index) => {
                      return (
                        <tr className="items-center">
                          <div className="px-4 py-2">{index + 1}</div>
                          <td className="border px-4 py-2">V{user.volunteerID}</td>
                          <td className="border px-4 py-2">{user.firstName}</td>
                          <td className="border px-4 py-2">{user.surname}</td>
                          <td className="border px-4 py-2">{user.email}</td>
                          <td className="border px-4 py-2">{user.mobile}</td>
                          <td className="border px-4 py-2">{user.addressGreaterArea}</td>
                          <td className="border px-4 py-2">{user.status}</td>
                          <td className="border px-4 py-2">
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
                          <td className="border px-4 py-2">
                            {user?.updatedAt?.getDate()?.toString() ?? ""}
                            {"/"}
                            {((user?.updatedAt?.getMonth() ?? 0) + 1)?.toString() ?? ""}
                            {"/"}
                            {user?.updatedAt?.getFullYear()?.toString() ?? ""}
                          </td>
                          <div className="flex">
                            <div className="group relative flex items-center justify-center">
                              <span className="absolute bottom-full hidden rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 shadow-sm group-hover:block">
                                Deletes volunteer
                              </span>
                              <Trash
                                size={24}
                                className="mx-2 my-3 rounded-lg hover:bg-orange-200"
                                onClick={() => handleDeleteModal(user.volunteerID, String(user.volunteerID), user.firstName ?? "")}
                              />
                            </div>
                            <div className="group relative flex items-center justify-center">
                              <span className="absolute bottom-full hidden rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 shadow-sm group-hover:block">
                                Updates volunteer
                              </span>
                              <Pencil
                                size={24}
                                className="mx-2 my-3 rounded-lg hover:bg-orange-200"
                                onClick={() => handleUpdateUserProfile(user.volunteerID)}
                              />
                            </div>
                            <div className="group relative flex items-center justify-center">
                              <span className="absolute bottom-full hidden w-[120px] rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 shadow-sm group-hover:block">
                                Views volunteer profile
                              </span>
                              <AddressBook
                                size={24}
                                className="mx-2 my-3 rounded-lg hover:bg-orange-200"
                                onClick={() => handleViewProfilePage(user.volunteerID)}
                              />
                            </div>

                            <div className="group relative flex items-center justify-center">
                              <span className="absolute bottom-full hidden w-[120px] rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 shadow-sm group-hover:block">
                                Adds today's clinic to volunteer
                              </span>
                              <Bed size={24} className="mx-2 my-3 rounded-lg hover:bg-orange-200" onClick={() => handleAddClinic(user.volunteerID)} />
                            </div>
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
                <b className=" text-2xl">{isUpdate ? "Update Volunteer Data" : "Create New Volunteer"}</b>
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
              <div className="flex flex-col items-start">
                {/*<div className="p-2">User ID: {(lastUserCreated?.data?.userID ?? 1000000) + 1}</div>*/}
                <div className="relative my-2 flex w-full flex-col rounded-lg border-2 bg-slate-200 p-4">
                  <b className="mb-3 text-center text-xl">Personal & Contact Data</b>
                  {isUpdate && (
                    <div className={`absolute ${user?.image ? "right-12" : "right-8"} top-16`}>
                      {user?.image ? (
                        <Image src={user?.image} alt="Afripaw profile pic" className="ml-auto aspect-auto max-h-40 max-w-[7rem]" width={140} height={160} />
                      ) : (
                        <UserCircle size={140} className="ml-auto aspect-auto max-h-52 max-w-[9rem] border-2" />
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
                        //void user.refetch();
                      }}
                    />
                  )}

                  <Input label="First Name" placeholder="Type here: e.g. John" value={firstName} onChange={setFirstName} required />
                  <Input label="Surname" placeholder="Type here: e.g. Doe" value={surname} onChange={setSurname} required />
                  <Input label="Email" placeholder="Type here: e.g. jd@gmail.com" value={email} onChange={setEmail} />
                  <Input label="Mobile" placeholder="Type here: e.g. 0821234567" value={mobile} onChange={setMobile} required />
                  {mobileMessage && <div className="text-sm text-red-500">{mobileMessage}</div>}

                  <div className="flex items-start">
                    <div className="mr-3 flex items-center pt-5">
                      <div className=" flex">
                        Preferred Communication Channel<div className="text-lg text-main-orange">*</div>:{" "}
                      </div>
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
                <div className="my-2 flex w-full flex-col rounded-lg border-2 bg-slate-200 p-4">
                  <b className="mb-3 text-center text-xl">Geographical & Location Data</b>
                  <div className="flex flex-col divide-y-2 divide-gray-300">
                    <div className="flex items-start">
                      <div className="mr-3 flex items-center pt-4">
                        <div className="flex">
                          Greater Area<div className="text-lg text-main-orange">*</div>:{" "}
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <button
                          ref={btnGreaterAreaRef}
                          className="my-3 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
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
                                  <button className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">{option}</button>
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

                        <Input label="Street Code" placeholder="Type here: e.g. C3" value={addressStreetCode} onChange={setAddressStreetCode} />

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
                        <div>Or, Alternatively, Free Form Address</div>
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
                  <b className="mb-3 text-center text-xl">Afripaw Association Data</b>

                  <div className="flex items-start">
                    <div className="mr-3 flex items-center pt-5">
                      <div className=" flex">
                        Status<div className="text-lg text-main-orange">*</div>:{" "}
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

                  {/*Clinics attended*/}
                  <div className="flex items-start">
                    <div className="mr-3 flex items-center pt-5">
                      <div className=" flex">Clinics Attended: {clinicList.length} in Total</div>
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

                  {/*DATEPICKER*/}
                  <div className="flex items-center">
                    <div className=" flex">
                      Starting Date<div className="text-lg text-main-orange">*</div>:{" "}
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
                    <div className="w-36 pt-3">Comments: </div>
                    <textarea
                      className="m-2 h-24 w-full rounded-lg border-2 border-slate-300 px-2 focus:border-black"
                      placeholder="Type here: e.g. Notes on commitment, engagement, etc."
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
                <div className=" text-2xl">Volunteer Profile</div>
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
                    <b className="mr-3">Greater Area:</b> {greaterAreaOption}
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
                      <b>Or, Free Form Address:</b>
                      <div className=" mt-3 focus:border-black" style={{ whiteSpace: "pre-wrap" }}>
                        {addressFreeForm}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="my-2 flex w-full flex-col rounded-lg border-2 bg-slate-200 p-4">
                  <b className="mb-3 text-center text-xl">Afripaw Association Data</b>

                  <div className="mb-2 flex items-center">
                    <b className="mr-3">Status:</b> {statusOption}
                  </div>

                  <div className="mb-2 flex items-center">
                    <b className="mr-3">Clinics Attended:</b> {clinicList.length} in Total (
                    {clinicList.map((clinic, index) => (clinicList.length - 1 == index ? clinic : clinic + ", "))})
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
