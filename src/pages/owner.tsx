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
import { sendUserCredentialsEmail } from "~/components/CommunicationPortals/email";

//Upload excel
import * as XLSX from "xlsx";

//Icons
import { AddressBook, Pencil, Dog, Printer, Trash, UserCircle, Users } from "phosphor-react";

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
import { router } from "@trpc/server";
import Link from "next/link";

const Owner: NextPage = () => {
  // useSession({ required: true });

  const newOwner = api.petOwner.create.useMutation();
  const updateOwner = api.petOwner.update.useMutation();
  const [isUpdate, setIsUpdate] = useState(false);
  const [isCreate, setIsCreate] = useState(false);
  const [isDoneUploading, setIsDoneUploading] = useState(false);
  //Update the table when user is deleted
  const [isDeleted, setIsDeleted] = useState(false);

  //For moving between different pages
  const router = useRouter();

  //-------------------------------UPDATE IDENTIFICATION-----------------------------------------
  const updateIdentification = api.petOwner.updateIdentification.useMutation();
  //get latest ownerID
  const latestOwnerID = api.petOwner.getLatestOwnerID.useQuery();
  /*
  //Excel upload
  const insertExcelData = api.petOwner.insertExcelData.useMutation();

  //---------------------------------BULK UPLOAD----------------------------------

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const bstr = event.target?.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[2]; // Assuming you're interested in the third sheet
      console.log("Sheet name: ", wsname);
      const ws: XLSX.WorkSheet | undefined = wb.Sheets[wsname as keyof typeof wb.Sheets];
      const data = ws ? XLSX.utils.sheet_to_json(ws) : [];
      console.log("Data: ", data);

      //This is the format that the insertExcelData mutation expects

      type petOwnerData = {
        firstName: string;
        email: string;
        surname: string;
        mobile: string;
        addressGreaterArea: string;
        addressArea: string;
        addressStreet: string;
        addressStreetCode: string;
        addressStreetNumber: string;
        addressFreeForm: string;
        preferredCommunication: string;
        status: string;
        startingDate: Date; // Or string if you are handling date as a string before conversion.
        comments: string;
      };

      //change the data so that it gives me the correct format for each column as in the petOwnerData type
      for (const obj of data as petOwnerData[]) {
        console.log("Object: ", obj);
        //Object.keys(obj).forEach((key) => {
        //  console.log("Key: ", key);
        //}
        //Change the format of the date
        obj.startingDate = new Date(obj.startingDate);
        //change the format of the mobile number
        obj.mobile = obj.mobile.toString();
        //change the format of the addressStreetNumber
        obj.addressStreetNumber = obj.addressStreetNumber.toString();
        //change the format of the addressStreetCode
        //obj.addressStreetCode = obj.addressStreetCode.toString();
        //change the  format of the addressPostalCode
        // obj.addressPostalCode = obj.addressPostalCode.toString();

        //add an addressFreeForm column
        obj.addressFreeForm = "";

        //add an addressPostalCode column
        // obj.addressPostalCode = "";

        //add a comments column
        obj.comments = "";

        //add addressStreetCode column
        obj.addressStreetCode = "";
      }

      //Turn the data into this type of object: {firstName: "John", surname: "Doe", email: "xxxxxxx@xxxxx", mobile: "0712345678", address: "1 Main Road, Observatory, Cape Town, 7925", comments: "None"}

      insertExcelData.mutate(data as petOwnerData[], {
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

  */

  //---------------------------------EMAILS----------------------------------
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

  //----------------------------COMMUNICATION OF USER DETAILS---------------------------
  //Send user's details to user
  const [sendOwnerDetails, setSendOwnerDetails] = useState(false);

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
  const deleteRow = api.petOwner.deleteOwner.useMutation();
  const handleDeleteRow = async (id: number) => {
    setIsDeleteModalOpen(false);
    await deleteRow.mutateAsync({ userID: id });
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
  const [order, setOrder] = useState("surname");

  //-------------------------------INFINITE SCROLLING WITH INTERSECTION OBSERVER-----------------------------------------
  const observerTarget = useRef<HTMLDivElement | null>(null);

  const [limit] = useState(12);
  const {
    data: queryData,
    fetchNextPage,
    hasNextPage,
    refetch,
  } = api.petOwner.searchOwnersInfinite.useInfiniteQuery(
    {
      ownerID: id,
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
  const pet_data = queryData?.pages.flatMap((page) => page.pets_data);

  //map all the users to pets and put in one array object called owner_data
  const owner_data = user_data?.map((user) => {
    const pets = pet_data?.filter((pet) => pet[0]?.ownerID === user.ownerID);
    return { ...user, pets };
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
  }, [isUpdate, isDeleted, isCreate, query, order, isDoneUploading]);

  const user = user_data?.find((user) => user.ownerID === id);

  //-------------------------------DELETE ALL USERS-----------------------------------------
  //Delete all users
  const deleteAllUsers = api.petOwner.deleteAllOwners.useMutation();
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

  //---------------------------------NAVIGATION OF OWNER TO PET----------------------------------
  useEffect(() => {
    if (router.asPath.includes("ownerID")) {
      setID(Number(router.asPath.split("=")[1]));
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
      setIsViewProfilePage(true);
      void handleViewProfilePage(Number(router.asPath.split("=")[1]));
    }
  }, [router.asPath]);

  //-------------------------------UPDATE USER-----------------------------------------
  //const user = api.petOwner.getOwnerByID.useQuery({ petOwnerID: id });

  //Order fields
  //sorts the table according to specific fields
  //const [order, setOrder] = useState("surname");

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

  //----------------------------COMMUNICATION OF USER DETAILS---------------------------
  //Send user's details to user
  // const [sendUserDetails, setSendUserDetails] = useState(false);

  //-------------------------------UPDATE USER-----------------------------------------
  //Update the user's details in fields
  const handleUpdateUserProfile = async (id: number) => {
    setID(id);

    const user = user_data?.find((user) => user.ownerID === id);
    if (user) {
      // Assuming userQuery.data contains the user object
      const userData = user;
      setFirstName(userData.firstName ?? "");
      setSurname(userData.surname ?? "");
      setEmail(userData.email ?? "");
      setMobile(userData.mobile ?? "");
      setGreaterAreaOption(userData.addressGreaterArea ?? "Select one");
      setAreaOption(userData.addressArea ?? "Select one");
      setStreetOption(userData.addressStreet ?? "Select one");
      setAddressStreetCode(userData.addressStreetCode ?? "");
      setAddressStreetNumber(userData.addressStreetNumber ?? "");
      // setAddressSuburb(userData.addressSuburb ?? "");
      //setAddressPostalCode(userData.addressPostalCode ?? "");
      setAddressFreeForm(userData.addressFreeForm ?? "");
      setPreferredCommunicationOption(userData.preferredCommunication ?? "Select one");
      setStartingDate(userData.startingDate ?? new Date());
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

    //isUpdate ? setIsUpdate(true) : setIsUpdate(true);
    //isCreate ? setIsCreate(false) : setIsCreate(false);
    setIsUpdate(true);
    setIsCreate(false);
  };

  useEffect(() => {
    if (user) {
      // Assuming userQuery.data contains the user object
      const userData = user;
      setFirstName(userData.firstName ?? "");
      setSurname(userData.surname ?? "");
      setEmail(userData.email ?? "");
      setMobile(userData.mobile ?? "");
      setGreaterAreaOption(userData.addressGreaterArea ?? "Select one");
      setAreaOption(userData.addressArea ?? "");
      setStreetOption(userData.addressStreet ?? "");
      setAddressStreetCode(userData.addressStreetCode ?? "");
      setAddressStreetNumber(userData.addressStreetNumber ?? "");
      //setAddressSuburb(userData.addressSuburb ?? "");
      //setAddressPostalCode(userData.addressPostalCode ?? "");
      setAddressFreeForm(userData.addressFreeForm ?? "");
      setPreferredCommunicationOption(userData.preferredCommunication ?? "Select one");
      setStartingDate(userData.startingDate ?? new Date());
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
  }, [isUpdate, isCreate]); // Effect runs when userQuery.data changes

  const handleUpdateUser = async () => {
    const owner = await updateOwner.mutateAsync({
      petOwnerID: id,
      firstName: firstName,
      email: email,
      surname: surname,
      mobile: mobile,
      addressGreaterArea: greaterAreaOption === "Select one" ? "" : greaterAreaOption,
      addressArea: areaOption === "Select one" ? "" : areaOption,
      addressStreet: streetOption === "Select one" ? "" : streetOption,
      addressStreetCode: addressStreetCode,
      addressStreetNumber: addressStreetNumber,
      //addressSuburb: addressSuburb,
      //addressPostalCode: addressPostalCode,
      addressFreeForm: addressFreeForm,
      preferredCommunication: preferredOption === "Select one" ? "" : preferredOption,
      startingDate: startingDate,
      status: statusOption === "Select one" ? "" : statusOption,
      comments: comments,
    });

    //Send user details
    //Email
    /* if (preferredOption === "Email" && sendUserDetails) {
      await sendUserCredentialsEmail(email);
    }*/

    if (preferredOption === "Email" && sendOwnerDetails && owner?.ownerID) {
      await sendEmail(firstName, email, String(owner?.ownerID), "", "owner");
    }

    if (preferredOption === "SMS" && sendOwnerDetails && owner?.ownerID) {
      const messageContent =
        "Dear " +
        firstName +
        ",\n" +
        "You have been registered as a owner on the AfriPaw Smart App." +
        "\nYour owner ID is: " +
        "U" +
        owner?.ownerID +
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

    //update identification table
    if (owner?.ownerID) {
      await updateIdentification.mutateAsync({
        ownerID: owner?.ownerID ?? 0,
      });
    }

    //After the newUser has been created make sure to set the fields back to empty
    setFirstName("");
    setEmail("");
    setSurname("");
    setMobile("");
    setGreaterAreaOption("Select one");
    setAreaOption("Select one");
    setStreetOption("Select one");
    setAddressStreetCode("");
    setAddressStreetNumber("");
    setAddressSuburb("");
    setAddressPostalCode("");
    setAddressFreeForm("");
    setPreferredCommunicationOption("Select one");
    setStatusOption("Select one");
    setComments("");
    setIsUpdate(false);
    setIsCreate(false);
  };

  //-------------------------------CREATE NEW USER-----------------------------------------

  const handleCreateNewUser = async () => {
    setGreaterAreaOption("Select one");
    setAreaOption("Select one");
    setStreetOption("Select one");
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
    setIsCreate(true);
    setIsUpdate(false);
  };
  //-------------------------------NEW USER-----------------------------------------

  const handleNewUser = async () => {
    try {
      const newUser_ = await newOwner.mutateAsync({
        firstName: firstName,
        email: email,
        surname: surname,
        mobile: mobile,
        addressGreaterArea: greaterAreaOption === "Select one" ? "" : greaterAreaOption,
        addressArea: areaOption === "Select one" ? "" : areaOption,
        addressStreet: streetOption === "Select one" ? "" : streetOption,
        addressStreetCode: addressStreetCode,
        addressStreetNumber: addressStreetNumber,
        // addressSuburb: addressSuburb,
        // addressPostalCode: addressPostalCode,
        addressFreeForm: addressFreeForm,
        preferredCommunication: preferredOption === "Select one" ? "" : preferredOption,
        startingDate: startingDate,
        status: statusOption === "Select one" ? "" : statusOption,
        comments: comments,
      });

      //Send user details
      //Email
      /* if (preferredOption === "Email" && sendUserDetails) {
      await sendUserCredentialsEmail(email);
    }*/

      if (preferredOption === "Email" && sendOwnerDetails && newUser_?.ownerID) {
        await sendEmail(firstName, email, String(newUser_.ownerID), "", "owner");
      }

      if (preferredOption === "SMS" && sendOwnerDetails && newUser_?.ownerID) {
        const messageContent =
          "Dear " +
          firstName +
          ",\n" +
          "You have been registered as a owner on the AfriPaw Smart App." +
          "\nYour owner ID is: " +
          "U" +
          id +
          "\n" +
          // "You indicated that your preferred means of communication is: SMS" +
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
      console.log("ID: ", newUser_?.ownerID, "Image: ", newUser_?.image, "Name: ", firstName, "IsUploadModalOpen: ", isUploadModalOpen);

      handleUploadModal(newUser_?.ownerID ?? "", firstName, newUser_?.image ?? "");
      setIsCreate(false);
      setIsUpdate(false);
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

    // return newUser_;
  };

  //-------------------------------VIEW PROFILE PAGE-----------------------------------------
  const [isViewProfilePage, setIsViewProfilePage] = useState(false);
  const handleViewProfilePage = async (id: number) => {
    setIsViewProfilePage(true);
    setID(id);
    const user = user_data?.find((user) => user.ownerID === id);
    console.log("View profile page: ", JSON.stringify(user));
    if (user) {
      // Assuming userQuery.data contains the user object
      const userData = user;
      setFirstName(userData.firstName ?? "");
      setSurname(userData.surname ?? "");
      setEmail(userData.email ?? "");
      setMobile(userData.mobile ?? "");
      setGreaterAreaOption(userData.addressGreaterArea ?? "");
      setAreaOption(userData.addressArea ?? "");
      setStreetOption(userData.addressStreet ?? "");
      setAddressStreetCode(userData.addressStreetCode ?? "");
      setAddressStreetNumber(userData.addressStreetNumber ?? "");
      //setAddressSuburb(userData.addressSuburb ?? "");
      //setAddressPostalCode(userData.addressPostalCode ?? "");
      setAddressFreeForm(userData.addressFreeForm ?? "");
      setPreferredCommunicationOption(userData.preferredCommunication ?? "");
      setStartingDate(userData.startingDate ?? new Date());
      setStatusOption(userData.status ?? "");
      setComments(userData.comments ?? "");
      setImage(userData.image ?? "");
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
    if (isViewProfilePage) {
      //void user.refetch();
    }
    if (user) {
      const userData = user;

      setFirstName(userData.firstName ?? "");
      setSurname(userData.surname ?? "");
      setEmail(userData.email ?? "");
      setMobile(userData.mobile ?? "");
      setGreaterAreaOption(userData.addressGreaterArea ?? "");
      setAreaOption(userData.addressArea ?? "");
      setStreetOption(userData.addressStreet ?? "");
      setAddressStreetCode(userData.addressStreetCode ?? "");
      setAddressStreetNumber(userData.addressStreetNumber ?? "");
      //setAddressSuburb(userData.addressSuburb ?? "");
      //setAddressPostalCode(userData.addressPostalCode ?? "");
      setAddressFreeForm(userData.addressFreeForm ?? "");
      setPreferredCommunicationOption(userData.preferredCommunication ?? "");
      setStartingDate(userData.startingDate ?? new Date());
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
  }, [isViewProfilePage]); // Effect runs when userQuery.data changes

  //Go to update page from the view profile page
  const handleUpdateFromViewProfilePage = async () => {
    setIsUpdate(true);
    setIsViewProfilePage(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  //-------------------------------BACK BUTTON-----------------------------------------
  const handleBackButton = async () => {
    //console.log("Back button pressed");

    if (Number(router.asPath.split("=")[1]) != 0 && !isUpdate && !isViewProfilePage && !isCreate) {
      await router.push(`/pet`);
    }

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
    setAreaOption("Select one");
    setStreetOption("Select one");
    setAddressStreetCode("");
    setAddressStreetNumber("");
    setAddressSuburb("");
    setAddressPostalCode("");
    setPreferredCommunicationOption("Select one");
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
    if (areaOption === "Select one") mandatoryFields.push("Area");
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
  const [deleteUserID, setDeleteUserID] = useState(0);
  const handleDeleteModal = (id: number, userID: string, name: string) => {
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
  const handleUploadModal = (ownerID: number, name: string, image: string) => {
    setIsUploadModalOpen(true);
    console.log("UserID: " + ownerID + " Name: " + name + " Image: " + image + "IsUploadModalOpen: " + isUploadModalOpen);
    //setIsCreate(true);
    setUploadUserID(String(ownerID));
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
  // } = api.petOwner.searchOwnersInfinite.useInfiniteQuery(
  //   {
  //     ownerID: id,
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

  //------------------------------------CREATE A NEW PET FOR OWNER--------------------------------------
  //When button is pressed the browser needs to go to the pet's page. The pet's page needs to know the owner's ID
  const handleCreateNewPet = async (id: number) => {
    await router.push({
      pathname: "/pet",
      query: { ownerID: id },
    });
  };

  //------------------------------------GO TO PET PROFILE--------------------------------------
  const handleGoToPetProfile = async (petID: number) => {
    await router.push({
      pathname: "/pet",
      query: { petID: petID },
    });
  };

  //-------------------------------------DATEPICKER--------------------------------------
  // Define the props for your custom input component
  interface CustomInputProps {
    value?: string;
    onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  }

  // ----------------------------------------Uploading Image----------------------------------------
  useEffect(() => {
    if (user?.image != "" && isDoneUploading) {
      setIsDoneUploading(false);
    }
  }, [user, isCreate, isUpdate, isViewProfilePage]);

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

  return (
    <>
      <Head>
        <title>User Profiles</title>
      </Head>
      <main className="flex flex-col">
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
              <ImageUploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                userID={uploadUserID}
                userType={"owner"}
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
                    Create New Owner
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
              <article className="my-6 flex max-h-[60%] w-full items-center justify-center overflow-auto rounded-md shadow-inner">
                <table className="table-auto">
                  <thead>
                    <tr>
                      <th className="px-4 py-2"></th>
                      <th className="px-4 py-2">ID</th>
                      <th className="px-4 py-2">Name</th>
                      <th className="px-4 py-2">
                        <span className="group relative inline-block">
                          <button className={`${order === "surname" ? "underline" : ""}`} onClick={() => handleOrderFields("surname")}>
                            Surname
                          </button>
                          <span className="absolute right-[-30px] top-full hidden w-[130px] whitespace-nowrap rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 shadow-sm group-hover:block">
                            Sort alphabetically
                          </span>
                        </span>
                      </th>

                      <th className="px-4 py-2">Email</th>
                      <th className="px-4 py-2">Mobile</th>
                      <th className="px-4 py-2">Greater Area</th>
                      <th className="px-4 py-2">Area</th>
                      <th className="px-4 py-2">Address</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2">Pets</th>
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
                    {owner_data?.map((user, index) => {
                      return (
                        <tr className="items-center">
                          <td className=" border px-4 py-2">
                            <div className="">{index + 1}</div>
                          </td>
                          <td className="border px-4 py-2">N{user.ownerID}</td>
                          <td className="border px-4 py-2">{user.firstName}</td>
                          <td className="border px-4 py-2">{user.surname}</td>
                          <td className="border px-4 py-2">{user.email}</td>
                          <td className="border px-4 py-2">{user.mobile}</td>
                          <td className="border px-4 py-2">{user.addressGreaterArea}</td>
                          <td className="border px-4 py-2">{user.addressArea}</td>
                          <td className="border px-4 py-2">
                            {user.addressStreetNumber} {user.addressStreet}
                          </td>
                          <td className="border px-4 py-2">{user.status}</td>
                          <td className="border px-4 py-2">
                            {user.pets?.map((pet) => {
                              return (
                                <div className="flex flex-col">
                                  {pet.map((pet_) => {
                                    return (
                                      <button className="underline hover:text-blue-400" onClick={() => handleGoToPetProfile(pet_.petID)}>
                                        {pet_.petName}
                                      </button>
                                    );
                                  })}
                                </div>
                              );
                            })}
                          </td>
                          <td className=" border px-4 py-2">
                            {user?.updatedAt?.getDate()?.toString() ?? ""}
                            {"/"}
                            {((user?.updatedAt?.getMonth() ?? 0) + 1)?.toString() ?? ""}
                            {"/"}
                            {user?.updatedAt?.getFullYear()?.toString() ?? ""}
                          </td>
                          <div className="flex">
                            <div className="relative flex items-center justify-center">
                              <span className="group relative mx-2 my-3 flex items-center justify-center rounded-lg hover:bg-orange-200">
                                <Trash
                                  size={24}
                                  className="block"
                                  onClick={() => handleDeleteModal(user.ownerID, String(user.ownerID), user.firstName ?? "")}
                                />
                                <span className="absolute bottom-full hidden rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 shadow-sm group-hover:block">
                                  Delete owner
                                </span>
                              </span>
                            </div>

                            <div className="relative flex items-center justify-center">
                              <span className="group relative mx-2 my-3 flex items-center justify-center rounded-lg hover:bg-orange-200">
                                <Pencil size={24} className="block" onClick={() => handleUpdateUserProfile(user.ownerID)} />
                                <span className="absolute bottom-full hidden rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 shadow-sm group-hover:block">
                                  Update owner
                                </span>
                              </span>
                            </div>

                            <div className="relative flex items-center justify-center">
                              <span className="group relative mx-2 my-3 flex items-center justify-center rounded-lg hover:bg-orange-200">
                                <AddressBook size={24} className="block" onClick={() => handleViewProfilePage(user.ownerID)} />
                                <span className="absolute bottom-full hidden w-[88px] rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 shadow-sm group-hover:block">
                                  View owner profile
                                </span>
                              </span>
                            </div>

                            <div className="relative flex items-center justify-center">
                              <span className="group relative mx-2 my-3 flex items-center justify-center rounded-lg hover:bg-orange-200">
                                <Dog size={24} className="block" onClick={() => handleCreateNewPet(user.ownerID)} />
                                <span className="absolute bottom-full hidden w-[90px] rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 shadow-sm group-hover:block">
                                  Add new pet to owner
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
              <div ref={observerTarget} />
            </div>
          </>
        )}
        {(isCreate || isUpdate) && (
          <>
            <div className="flex justify-center">
              <div className="relative mb-4 flex grow flex-col items-center rounded-lg bg-slate-200 px-5 py-6">
                <b className=" text-2xl">{isUpdate ? "Update Owner Data" : "Create New Owner"}</b>
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
              <div className="flex flex-col">
                {/*<div className="p-2">User ID: {(lastUserCreated?.data?.userID ?? 1000000) + 1}</div>*/}
                <div className="relative my-2 flex w-full flex-col rounded-lg border-2 bg-slate-200 p-4">
                  <b className="mb-3 text-center text-xl">Personal & Contact Data</b>
                  {isUpdate && (
                    <div className={`absolute ${user?.image ? "right-12" : "right-8"} top-16`}>
                      {user?.image ? (
                        <Image src={user?.image} alt="Afripaw profile pic" className="ml-auto aspect-auto max-h-40 max-w-[7rem]" width={140} height={100} />
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
                      input={{ userId: String(user?.ownerID) ?? "", user: "owner" }}
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
                    Owner ID: <div className="px-3">N{latestOwnerID?.data?.petOwnerID ?? 0}</div>
                  </div>
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
                        <div className="flex items-start">
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
                            <div className=" flex">Street: </div>
                          </div>
                          <div className="flex flex-col">
                            <button
                              ref={btnStreetRef}
                              className="my-3 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
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
                                      <button className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">{option}</button>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>

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

                        {/*} <div className="flex items-center">
                          <div>11. Suburb: </div>
                          <input
                            className="m-2 rounded-lg border-2 border-slate-300 px-2 focus:border-black"
                            placeholder="Type here: e.g. Lakeside"
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
                                  {postalCodeMessage && <div className="text-sm text-red-500">{postalCodeMessage}</div>}*/}
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
                    <div className="w-32 pt-3">Comments: </div>
                    <textarea
                      className="m-2 h-24 w-full rounded-lg border-2 border-slate-300 px-2 focus:border-black"
                      placeholder="Type here: e.g. Notes on commitment, engagement, etc."
                      onChange={(e) => setComments(e.target.value)}
                      value={comments}
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      id="checked-checkbox"
                      type="checkbox"
                      onChange={(e) => setSendOwnerDetails(e.target.checked)}
                      className="h-4 w-4 rounded bg-gray-100 text-main-orange accent-main-orange focus:ring-2"
                    />
                    <label htmlFor="checked-checkbox" className="ms-2 text-sm font-medium text-gray-900">
                      Welcome owner via preferred communication channel
                    </label>
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
                <div className=" text-2xl">Owner Profile</div>
                <div className="flex justify-center">
                  <button className="absolute right-0 top-0 m-3 rounded-lg bg-main-orange p-3 text-white hover:bg-orange-500" onClick={handleBackButton}>
                    Back
                  </button>
                </div>
              </div>
            </div>
            <div ref={printComponentRef} className="flex grow flex-col items-center">
              <div className="mt-6 flex w-[40%] max-w-xl flex-col items-start">
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
                      <Image src={image} alt="Afripaw profile pic" className="ml-auto aspect-auto max-h-52 max-w-[9rem]" width={150} height={200} />
                    ) : (
                      <UserCircle size={140} className="ml-auto aspect-auto max-h-52 max-w-[9rem]" />
                    )}
                  </div>
                  <b className="mb-14 text-center text-xl">Personal & Contact Data</b>
                  <div className="mb-2 flex items-center">
                    <b className="mr-3">Owner ID:</b> N{id}
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
                      {/*
                      <div className="mb-2 flex items-center">
                        <b className="mr-3">Suburb:</b> {addressSuburb}
                      </div>

                      <div className="mb-2 flex items-center">
                        <b className="mr-3">Postal Code:</b> {addressPostalCode}
                    </div>*/}
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
                    <b className="mr-3">Starting Date:</b> {startingDate?.toLocaleDateString()}
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

export default Owner;
