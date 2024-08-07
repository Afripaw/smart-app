import { type NextPage } from "next";
import Head from "next/head";
import React, { SetStateAction, useEffect, useRef, useState } from "react";
//import { api } from "~/utils/api";
import Navbar from "../components/navbar";
import { useSession } from "next-auth/react";
import { api } from "~/utils/api";
//Date picker
// import DatePicker from "react-datepicker";
// import "react-datepicker/dist/react-datepicker.css";

// //MUI Date picker
import dayjs, { Dayjs } from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import type {} from "@mui/x-date-pickers/themeAugmentation";

//Excel
import * as XLSX from "xlsx";

//File saver
//import FileSaver from "file-saver";
import * as FileSaver from "file-saver";

//permissions
import usePageAccess from "../hooks/usePageAccess";

import { FastForwardCircle } from "phosphor-react";

const Info: NextPage = () => {
  //checks user session and page access
  useSession({ required: true });
  const hasAccess = usePageAccess(["System Administrator", "Data Analyst", "Data Consumer"]);

  //MUI Datepicker fontsize
  const theme = createTheme({
    typography: {
      fontSize: 12,
    },
    components: {
      MuiTextField: {
        styleOverrides: {
          root: {
            "& .MuiInputBase-root": {
              fontSize: 14, // Font size for the DatePicker input
            },
          },
        },
      },
      MuiPickersDay: {
        styleOverrides: {
          root: {
            fontSize: "1rem", // Font size for the calendar days
          },
        },
      },
      MuiTypography: {
        styleOverrides: {
          root: {
            fontSize: "1rem", // Font size for general text within the calendar
          },
        },
      },

      MuiPickersCalendarHeader: {
        styleOverrides: {
          switchViewButton: {
            fontSize: "1rem", // Font size for the header view buttons
          },
          label: {
            fontSize: "1rem", // Font size for the header label
          },
        },
      },
      MuiPickersToolbar: {
        styleOverrides: {
          root: {
            "& .MuiTypography-root": {
              fontSize: "1rem", // Font size for the toolbar text
            },
          },
        },
      },
    },
  });

  //Loading
  const [isLoading, setIsLoading] = useState(false);

  //generate buttons
  const [generatedSterilisation, setGeneratedSterilisation] = useState(false);
  const [generatedMembership, setGeneratedMembership] = useState(false);
  const [generatedClinic, setGeneratedClinic] = useState(false);

  //formatting dates
  // Function to format a date object as a string in "DD/MM/YYYY" format
  function formatDate(date: Date): string {
    const day = date.getDate().toString();
    const month = (date.getMonth() + 1).toString();
    const year = date.getFullYear().toString();
    return `${day}/${month}/${year}`;
  }

  //checks if deworming was more than 3 months ago if cat and 6 months ago if dog
  const isMoreThanSixMonthsAgo = (date: Date, species: string): boolean => {
    const sixMonthsAgo = new Date();
    if (species === "Cat") {
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 2);
      sixMonthsAgo.setDate(sixMonthsAgo.getDate() - 15);
    } else {
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
      sixMonthsAgo.setDate(sixMonthsAgo.getDate() - 15);
    }

    return date < sixMonthsAgo;
  };

  //Checks if card status of membership is lapsed or active
  const membershipStatus = (membershipType: string, clinicsAttended: Date[]): string => {
    if (
      membershipType === "Standard Card Holder" ||
      membershipType === "Standard card holder" ||
      membershipType === "Gold Card Holder" ||
      membershipType === "Gold card holder"
    ) {
      const today = new Date();
      // Convert clinicList dates to Date objects
      // const clinicDates = clinicsAttended.map((clinicDate) => {
      //   const [day, month, year] = clinicDate.split("/").map(Number);
      //   return new Date(year ?? 0, (month ?? 0) - 1, day);
      // });
      const clinicDates = clinicsAttended;

      // Sort clinic dates in ascending order
      clinicDates.sort((a, b) => a.getTime() - b.getTime());

      let isLapsed = false;
      let lapseDate = new Date(0);

      // Check for gaps of 3 months or more
      for (let i = 1; i < clinicDates.length; i++) {
        const prevDate = clinicDates[i - 1];
        const currentDate = clinicDates[i];
        // console.log("Prev date: ", prevDate);
        // console.log("Current date: ", currentDate);
        const pastDate = new Date(prevDate!);
        pastDate.setMonth((prevDate?.getMonth() ?? 0) + 3);

        const today_ = new Date(today);
        today_.setMonth(today.getMonth() - 3);
        //console.log("clinicDates[0]: ", clinicDates[0]);
        //console.log("today_", today_);
        const today__ = today_.getTime();
        const latestClinicDate = clinicDates[clinicDates.length - 1]?.getTime() ?? 0;

        if (today__ >= latestClinicDate) {
          //console.log("lapsed by today");
          isLapsed = true;
          lapseDate = today;
          // break;
        }

        if (currentDate! >= pastDate) {
          //console.log("lapsed by: ", currentDate);
          isLapsed = true;
          lapseDate = currentDate ?? new Date(0);
          // break;
        }

        if (isLapsed && lapseDate.getFullYear() != 1970) {
          const sixMonthsAfterLapse = new Date(lapseDate);
          sixMonthsAfterLapse.setMonth(lapseDate.getMonth() + 6);

          //console.log("Lapsed date: ", lapseDate);
          //console.log("Six months after lapse: ", sixMonthsAfterLapse);

          const clinicsInNextSixMonths = clinicDates.filter((date) => date > lapseDate && date <= sixMonthsAfterLapse);

          //console.log("Clinics in next sixe months: ", clinicsInNextSixMonths.length);

          if (clinicsInNextSixMonths.length >= 3) {
            isLapsed = false;
          } else {
            isLapsed = true;
          }
        } else {
          isLapsed = false;
        }
      }

      return isLapsed ? "Lapsed" : "Active";
    } else {
      return "Not Applicable";
    }
  };

  // //checks what dates are in the two given dates or on the single date
  // const DatesInPeriod = (dates: Date[]): string[] =>{
  //   if (periodOption === "Time Period"){
  //     const dates_ = dates.map((date)=>{
  //       if (clinicStartingDate <= date <= clinicEndingDate){
  //         return formatDate(date);
  //       }
  //     })
  //     return dates_;
  //   }else if (periodOption === "Single Day"){
  //     const date_ = dates.map((date)=>{
  //       if (clinicSingleDate == date){
  //         return formatDate(date);
  //       }
  //     })
  //     return date_;
  //   }else{
  //     return "";
  //   }
  // }

  // //--------------------------------------DOWNLOAD DATABASE---------------------------------------------------
  // //Download sterilisation
  // const downloadDatabase = api.info.downloadDatabase.useQuery();

  // //variable for checking if button was pressed
  // const [downloadData, setDownloadData] = useState(false);

  // useEffect(() => {
  //   if (downloadDatabase.isSuccess && !downloadDatabase.isFetching && downloadData) {
  //     const data = downloadDatabase.data;

  //     const fileName = `AfriPaw Database - ${formatDate(new Date())}`;
  //     const fileType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
  //     const fileExtension = ".xlsx";

  //     // Create a new workbook
  //     const workbook = XLSX.utils.book_new();

  //     // Add each sheet to the workbook
  //     const wsUser = XLSX.utils.json_to_sheet(data.userData ?? []);
  //     XLSX.utils.book_append_sheet(workbook, wsUser, "User");

  //     const wsVolunteer = XLSX.utils.json_to_sheet(data.volunteerData ?? []);
  //     XLSX.utils.book_append_sheet(workbook, wsVolunteer, "Volunteer");

  //     const wsPetOwner = XLSX.utils.json_to_sheet(data.petOwnerData ?? []);
  //     XLSX.utils.book_append_sheet(workbook, wsPetOwner, "Pet Owner");

  //     const wsPet = XLSX.utils.json_to_sheet(data.petData ?? []);
  //     XLSX.utils.book_append_sheet(workbook, wsPet, "Pet");

  //     const wsPetTreatment = XLSX.utils.json_to_sheet(data.treatmentData ?? []);
  //     XLSX.utils.book_append_sheet(workbook, wsPetTreatment, "Pet Treatment");

  //     // const wsType = XLSX.utils.json_to_sheet(data.typeData ?? []);
  //     // XLSX.utils.book_append_sheet(workbook, wsType, "Treatment Type");

  //     const wsPetClinic = XLSX.utils.json_to_sheet(data.clinicData ?? []);
  //     XLSX.utils.book_append_sheet(workbook, wsPetClinic, "Pet Clinic");

  //     // const wsConditions = XLSX.utils.json_to_sheet(data.conditionsData ?? []);
  //     // XLSX.utils.book_append_sheet(workbook, wsConditions, "Conditions");

  //     const wsGreaterArea = XLSX.utils.json_to_sheet(data.greaterAreaData ?? []);
  //     XLSX.utils.book_append_sheet(workbook, wsGreaterArea, "Greater Area");

  //     const wsArea = XLSX.utils.json_to_sheet(data.areaData ?? []);
  //     XLSX.utils.book_append_sheet(workbook, wsArea, "Area");

  //     const wsStreet = XLSX.utils.json_to_sheet(data.streetData ?? []);
  //     XLSX.utils.book_append_sheet(workbook, wsStreet, "Street");

  //     const wsMessage = XLSX.utils.json_to_sheet(data.messageData ?? []);
  //     XLSX.utils.book_append_sheet(workbook, wsMessage, "Message");

  //     // Write the workbook to a binary buffer
  //     const excelBuffer: Uint8Array = XLSX.write(workbook, { bookType: "xlsx", type: "array" }) as Uint8Array;

  //     // Create a Blob from the binary buffer
  //     const dataFile = new Blob([excelBuffer], { type: fileType });

  //     // Save the Blob as an Excel file
  //     FileSaver.saveAs(dataFile, fileName + fileExtension);

  //     setDownloadData(false);
  //     setIsLoading(false);
  //   }
  // }, [downloadDatabase.isFetched, downloadDatabase.isSuccess, downloadDatabase.isFetching]);

  // const handleDownloadDatabase = async () => {
  //   setIsLoading(true);

  //   void downloadDatabase.refetch();
  //   setDownloadData(true);
  //   setIsLoading(false);
  // };

  //---------------------------------------STERILISATION DUE QUERIES------------------------------------------------
  //STERILISATION DUE
  const [sterilisationDue, setSterilisationDue] = useState(false);
  const [sterilisationDueOption, setSterilisationDueOption] = useState("Select one");
  const sterilisationDueRef = useRef<HTMLDivElement>(null);
  const btnSterilisationDueRef = useRef<HTMLButtonElement>(null);

  const handleToggleSterilisationDue = () => {
    setSterilisationDue(!sterilisationDue);
  };

  const handleSterilisationDueOption = (option: SetStateAction<string>) => {
    setSterilisationDueOption(option);
    setSterilisationDue(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sterilisationDueRef.current &&
        !sterilisationDueRef.current.contains(event.target as Node) &&
        btnSterilisationDueRef.current &&
        !btnSterilisationDueRef.current.contains(event.target as Node)
      ) {
        setSterilisationDue(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const sterilisationDueOptions = ["Requested", "Actioned", "No Show"];

  //DATES
  //startDate
  const [sterilisationStartingDate, setSterilisationStartingDate] = useState(new Date());
  const [sterilisationStartingDatejs, setSterilisationStartingDatejs] = useState(dayjs(new Date()));
  //endDate
  const [sterilisationEndingDate, setSterilisationEndingDate] = useState(new Date());
  const [sterilisationEndingDatejs, setSterilisationEndingDatejs] = useState(dayjs(new Date()));

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
      {value}
      {/* {isUpdate ? sterilisationStartingDate?.getDate().toString() + "/" + (startingDate.getMonth() + 1).toString() + "/" + startingDate.getFullYear().toString() : value} */}
    </button>
  );

  // //SPECIES
  // const [speciesSterilise, setSpeciesSterilise] = useState(false);
  // const [speciesSteriliseOption, setSpeciesSteriliseOption] = useState("Select one");
  // const speciesSteriliseRef = useRef<HTMLDivElement>(null);
  // const btnSpeciesSteriliseRef = useRef<HTMLButtonElement>(null);

  // const handleToggleSpeciesSterilise = () => {
  //   setSpeciesSterilise(!speciesSterilise);
  // };

  // const handleSpeciesSteriliseOption = (option: SetStateAction<string>) => {
  //   setSpeciesSteriliseOption(option);
  //   setSpeciesSterilise(false);
  // };

  // useEffect(() => {
  //   const handleClickOutside = (event: MouseEvent) => {
  //     if (
  //       speciesSteriliseRef.current &&
  //       !speciesSteriliseRef.current.contains(event.target as Node) &&
  //       btnSpeciesSteriliseRef.current &&
  //       !btnSpeciesSteriliseRef.current.contains(event.target as Node)
  //     ) {
  //       setSpeciesSterilise(false);
  //     }
  //   };

  //   document.addEventListener("mousedown", handleClickOutside);
  //   return () => {
  //     document.removeEventListener("mousedown", handleClickOutside);
  //   };
  // }, []);

  // const speciesSteriliseOptions = ["Dog", "Cat"];

  //SPECIES
  //------------------------------SPECIES-----------------------------------------
  type SpecieOptions = {
    species: string;
    state: boolean;
  };

  const [species, setSpecies] = useState(false);
  const [speciesOption, setSpeciesOption] = useState("Select here");
  const speciesRef = useRef<HTMLDivElement>(null);
  const btnSpeciesRef = useRef<HTMLButtonElement>(null);

  const [specieListOptions, setSpecieListOptions] = useState<SpecieOptions[]>([]);
  //to select multiple species
  const [specieList, setSpecieList] = useState<string[]>([]);

  const handleSpecie = (option: SetStateAction<string>, state: boolean) => {
    setSpeciesOption(option);
    // setSpecieSelection({ allSelected: false, clear: false });
    if (state) {
      if (!specieList.includes(String(option))) {
        setSpecieList([...specieList, String(option)]);
      }
      setSpecieListOptions(specieListOptions.map((specie) => (specie.species === option ? { ...specie, state: true } : specie)));
    } else {
      const updatedSpecieList = specieList.filter((specie) => specie !== option);
      setSpecieList(updatedSpecieList);
      setSpecieListOptions(specieListOptions.map((specie) => (specie.species === option ? { ...specie, state: false } : specie)));
    }
  };

  //show all available options
  const speciesOptions = ["Dog", "Cat"];

  const handleToggleSpecies = () => {
    setSpecies(!species);
  };

  const handleSpeciesOption = (option: SetStateAction<string>) => {
    setSpeciesOption(option);
    setSpecies(false);
    if (!specieList.includes(String(option))) {
      setSpecieList([...specieList, String(option)]);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        speciesRef.current &&
        !speciesRef.current.contains(event.target as Node) &&
        btnSpeciesRef.current &&
        !btnSpeciesRef.current.contains(event.target as Node)
      ) {
        setSpecies(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  //set specieListOptions at startup
  useEffect(() => {
    setSpecieListOptions(
      speciesOptions.map((specie) => ({
        species: specie,
        state: false,
      })),
    );
  }, []);

  //STERILISATION INFINITE SCROLLING
  const observerSterilisationTarget = useRef<HTMLDivElement | null>(null);

  const [limit] = useState(8);
  const {
    data: querySterilisationData,
    fetchNextPage: fetchNextSterilisationPage,
    hasNextPage: hasNextSterilisationPage,
    refetch: refetchSterilisation,
  } = api.info.getSterilisationInfinite.useInfiniteQuery(
    {
      limit: limit,
      typeOfQuery: sterilisationDueOption,
      startDate: sterilisationStartingDate,
      endDate: sterilisationEndingDate,
      //species: speciesSteriliseOption,
      species: specieList,
      //order
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
  const sterilisationData = querySterilisationData?.pages.flatMap((page) => page.data);

  //Checks intersection of the observer target and reassigns target element once true
  useEffect(() => {
    if (!observerSterilisationTarget.current || !fetchNextSterilisationPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextSterilisationPage) void fetchNextSterilisationPage();
      },
      { threshold: 1 },
    );

    if (observerSterilisationTarget.current) observer.observe(observerSterilisationTarget.current);

    const currentTarget = observerSterilisationTarget.current;

    return () => {
      if (currentTarget) observer.unobserve(currentTarget);
    };
  }, [fetchNextSterilisationPage, hasNextSterilisationPage, observerSterilisationTarget]);

  //for when order is implemented
  // useEffect(() => {
  //   void refetch();
  // }, [order]);

  //Generate table button

  //when dropdowns are selected again the table should dissappear
  useEffect(() => {
    setGeneratedSterilisation(false);
  }, [sterilisationDueOption, sterilisationStartingDate, sterilisationEndingDate, specieList]);
  //speciesSteriliseOption

  const handleSteriliseGenerate = async () => {
    setIsLoading(true);
    void refetchSterilisation();
    setGeneratedSterilisation(true);
    setGeneratedMembership(false);
    setGeneratedClinic(false);
    setIsLoading(false);
  };

  //Download sterilisation
  const downloadSterilisationTable = api.info.downloadSterilisation.useQuery(
    {
      typeOfQuery: sterilisationDueOption,
      startDate: sterilisationStartingDate,
      endDate: sterilisationEndingDate,
      // species: speciesSteriliseOption,
      species: specieList,
    },
    { enabled: hasAccess },
  );

  //variable for checking if buttton was pressed
  const [downloadSterilise, setDownloadSterilise] = useState(false);

  useEffect(() => {
    if (downloadSterilisationTable.isSuccess && !downloadSterilisationTable.isFetching && downloadSterilise) {
      //take the download user table query data and put it in an excel file
      const data = downloadSterilisationTable.data?.data;

      // console.log("Sterilisation Data: ", data);
      const fileName = `Sterilisation ${sterilisationDueOption} Table`;
      const fileType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
      const fileExtension = ".xlsx";
      const ws = XLSX.utils.json_to_sheet(data ?? []);
      const wb = { Sheets: { data: ws }, SheetNames: ["data"] };
      const excelBuffer: Uint8Array = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as Uint8Array;
      const dataFile = new Blob([excelBuffer], { type: fileType });
      FileSaver.saveAs(dataFile, fileName + fileExtension);
      setDownloadSterilise(false);
      setIsLoading(false);
    }
  }, [downloadSterilisationTable.isFetched, downloadSterilisationTable.isSuccess, downloadSterilisationTable.isFetching]);

  const handleDownloadSterilisationTable = async () => {
    setIsLoading(true);

    void downloadSterilisationTable.refetch();
    setDownloadSterilise(true);

    // //take the download user table query data and put it in an excel file
    // const data = downloadSterilisationTable.data?.data;

    // console.log("Sterilisation Data: ", data);
    // const fileName = `Sterilisation ${sterilisationDueOption} Table`;
    // const fileType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
    // const fileExtension = ".xlsx";
    // const ws = XLSX.utils.json_to_sheet(data ?? []);
    // const wb = { Sheets: { data: ws }, SheetNames: ["data"] };
    // const excelBuffer: Uint8Array = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as Uint8Array;
    // const dataFile = new Blob([excelBuffer], { type: fileType });
    // FileSaver.saveAs(dataFile, fileName + fileExtension);
    setIsLoading(false);
  };

  //------------------------------------------------MEMBERSHIP TYPE QUERIES-----------------------------------------
  //MEMBERSHIP TYPE
  const [membership, setMembership] = useState(false);
  const [membershipOption, setMembershipOption] = useState("Select one");
  const membershipRef = useRef<HTMLDivElement>(null);
  const btnMembershipRef = useRef<HTMLButtonElement>(null);

  const handleToggleMembership = () => {
    setMembership(!membership);
  };

  const handleMembershipOption = (option: SetStateAction<string>) => {
    setMembershipOption(option);
    setMembership(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        membershipRef.current &&
        !membershipRef.current.contains(event.target as Node) &&
        btnMembershipRef.current &&
        !btnMembershipRef.current.contains(event.target as Node)
      ) {
        setMembership(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const membershipOptions = ["Standard Card Holder", "Gold Card Holder"];

  //DATES
  //startDate
  const [membershipStartingDate, setMembershipStartingDate] = useState(new Date());
  const [membershipStartingDatejs, setMembershipStartingDatejs] = useState(dayjs(new Date()));
  //endDate
  const [membershipEndingDate, setMembershipEndingDate] = useState(new Date());
  const [membershipEndingDatejs, setMembershipEndingDatejs] = useState(dayjs(new Date()));

  //Old radio button species dropdown
  // //SPECIES
  // const [speciesMembership, setSpeciesMembership] = useState(false);
  // const [speciesMembershipOption, setSpeciesMembershipOption] = useState("Select one");
  // const speciesMembershipRef = useRef<HTMLDivElement>(null);
  // const btnSpeciesMembershipRef = useRef<HTMLButtonElement>(null);

  // const handleToggleSpeciesMembership = () => {
  //   setSpeciesMembership(!speciesMembership);
  // };

  // const handleSpeciesMembershipOption = (option: SetStateAction<string>) => {
  //   setSpeciesMembershipOption(option);
  //   setSpeciesMembership(false);
  // };

  // useEffect(() => {
  //   const handleClickOutside = (event: MouseEvent) => {
  //     if (
  //       speciesMembershipRef.current &&
  //       !speciesMembershipRef.current.contains(event.target as Node) &&
  //       btnSpeciesMembershipRef.current &&
  //       !btnSpeciesMembershipRef.current.contains(event.target as Node)
  //     ) {
  //       setSpeciesMembership(false);
  //     }
  //   };

  //   document.addEventListener("mousedown", handleClickOutside);
  //   return () => {
  //     document.removeEventListener("mousedown", handleClickOutside);
  //   };
  // }, []);

  // const speciesMembershipOptions = ["Dog", "Cat"];

  //SPECIES MEMBERSHIP
  //------------------------------SPECIES MEMBERSHIP-----------------------------------------

  const [speciesMembership, setSpeciesMembership] = useState(false);
  const [speciesMembershipOption, setSpeciesMembershipOption] = useState("Select here");
  const speciesMembershipRef = useRef<HTMLDivElement>(null);
  const btnSpeciesMembershipRef = useRef<HTMLButtonElement>(null);

  const [specieMembershipListOptions, setSpecieMembershipListOptions] = useState<SpecieOptions[]>([]);
  //to select multiple species
  const [specieMembershipList, setSpecieMembershipList] = useState<string[]>([]);

  const handleSpecieMembership = (option: SetStateAction<string>, state: boolean) => {
    setSpeciesMembershipOption(option);
    // setSpecieSelection({ allSelected: false, clear: false });
    if (state) {
      if (!specieMembershipList.includes(String(option))) {
        setSpecieMembershipList([...specieMembershipList, String(option)]);
      }
      setSpecieMembershipListOptions(specieMembershipListOptions.map((specie) => (specie.species === option ? { ...specie, state: true } : specie)));
    } else {
      const updatedSpecieList = specieList.filter((specie) => specie !== option);
      setSpecieMembershipList(updatedSpecieList);
      setSpecieMembershipListOptions(specieMembershipListOptions.map((specie) => (specie.species === option ? { ...specie, state: false } : specie)));
    }
  };
  // const [kennelList, setKennelList] = useState<string[]>([]);
  //show all available options
  const speciesMembershipOptions = ["Dog", "Cat"];

  const handleToggleSpeciesMembership = () => {
    setSpeciesMembership(!speciesMembership);
  };

  const handleSpeciesMembershipOption = (option: SetStateAction<string>) => {
    setSpeciesMembershipOption(option);
    setSpeciesMembership(false);
    if (!specieMembershipList.includes(String(option))) {
      setSpecieMembershipList([...specieMembershipList, String(option)]);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        speciesMembershipRef.current &&
        !speciesMembershipRef.current.contains(event.target as Node) &&
        btnSpeciesMembershipRef.current &&
        !btnSpeciesMembershipRef.current.contains(event.target as Node)
      ) {
        setSpeciesMembership(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  //set specieListOptions at startup
  useEffect(() => {
    setSpecieMembershipListOptions(
      speciesMembershipOptions.map((specie) => ({
        species: specie,
        state: false,
      })),
    );
  }, []);

  //MEMBERSHIP INFINITE SCROLLING
  const observerMembershipTarget = useRef<HTMLDivElement | null>(null);

  const [limitMembership] = useState(8);
  const {
    data: queryMembershipData,
    fetchNextPage: fetchNextMembershipPage,
    hasNextPage: hasNextMembershipPage,
    refetch: refetchMembership,
  } = api.info.getMembershipInfinite.useInfiniteQuery(
    {
      limit: limitMembership,
      typeOfQuery: membershipOption,
      startDate: membershipStartingDate,
      endDate: membershipEndingDate,
      //species: speciesMembershipOption,
      species: specieMembershipList,
      //order
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
  const membershipData = queryMembershipData?.pages.flatMap((page) => page.data);

  //Checks intersection of the observer target and reassigns target element once true
  useEffect(() => {
    if (!observerMembershipTarget.current || !fetchNextMembershipPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextMembershipPage) void fetchNextMembershipPage();
      },
      { threshold: 1 },
    );

    if (observerMembershipTarget.current) observer.observe(observerMembershipTarget.current);

    const currentTarget = observerMembershipTarget.current;

    return () => {
      if (currentTarget) observer.unobserve(currentTarget);
    };
  }, [fetchNextMembershipPage, hasNextMembershipPage, observerMembershipTarget]);

  //for when order is implemented
  // useEffect(() => {
  //   void refetch();
  // }, [order]);

  //Generate table button

  //when dropdowns are selected again the table should dissappear
  useEffect(() => {
    setGeneratedMembership(false);
  }, [membershipOption, membershipStartingDate, membershipEndingDate, specieMembershipList]);
  //speciesMembershipOption

  const handleMembershipGenerate = async () => {
    setIsLoading(true);
    void refetchMembership();
    setGeneratedSterilisation(false);
    setGeneratedMembership(true);
    setGeneratedClinic(false);
    setIsLoading(false);
  };

  //Download membership
  const downloadMembershipTable = api.info.downloadMembership.useQuery(
    {
      typeOfQuery: membershipOption,
      startDate: membershipStartingDate,
      endDate: membershipEndingDate,
      //species: speciesMembershipOption,
      species: specieMembershipList,
    },
    { enabled: hasAccess },
  );

  //variable for checking if buttton was pressed
  const [downloadMembership, setDownloadMembership] = useState(false);

  useEffect(() => {
    if (downloadMembershipTable.isSuccess && !downloadMembershipTable.isFetching && downloadMembership) {
      //take the download user table query data and put it in an excel file
      const data = downloadMembershipTable.data?.data;
      const fileName = `${membershipOption} Membership Table`;
      const fileType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
      const fileExtension = ".xlsx";
      const ws = XLSX.utils.json_to_sheet(data ?? []);
      const wb = { Sheets: { data: ws }, SheetNames: ["data"] };
      const excelBuffer: Uint8Array = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as Uint8Array;
      const dataFile = new Blob([excelBuffer], { type: fileType });
      FileSaver.saveAs(dataFile, fileName + fileExtension);
      setDownloadMembership(false);
    }
  }, [downloadMembershipTable.isFetched, downloadMembershipTable.isSuccess, downloadMembershipTable.isFetching]);

  const handleDownloadMembershipTable = async () => {
    setIsLoading(true);

    void downloadMembershipTable.refetch();
    setDownloadMembership(true);
    // //take the download user table query data and put it in an excel file
    // const data = downloadMembershipTable.data?.data;
    // const fileName = `${membershipOption} Membership Table`;
    // const fileType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
    // const fileExtension = ".xlsx";
    // const ws = XLSX.utils.json_to_sheet(data ?? []);
    // const wb = { Sheets: { data: ws }, SheetNames: ["data"] };
    // const excelBuffer: Uint8Array = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as Uint8Array;
    // const dataFile = new Blob([excelBuffer], { type: fileType });
    // FileSaver.saveAs(dataFile, fileName + fileExtension);
    setIsLoading(false);
  };

  //------------------------------------------------PET CLINIC QUERIES-----------------------------------------
  //PET CLINIC
  const [clinic, setClinic] = useState(false);
  const [clinicOption, setClinicOption] = useState("Select one");
  const clinicRef = useRef<HTMLDivElement>(null);
  const btnClinicRef = useRef<HTMLButtonElement>(null);

  const handleToggleClinic = () => {
    setClinic(!clinic);
  };

  const handleClinicOption = (option: SetStateAction<string>) => {
    setClinicOption(option);
    setClinic(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        clinicRef.current &&
        !clinicRef.current.contains(event.target as Node) &&
        btnClinicRef.current &&
        !btnClinicRef.current.contains(event.target as Node)
      ) {
        setClinic(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const clinicOptions = ["Clinic Attendance", "Treatment Administered"];

  //PERIOD
  const [period, setPeriod] = useState(false);
  const [periodOption, setPeriodOption] = useState("Select one");
  const periodRef = useRef<HTMLDivElement>(null);
  const btnPeriodRef = useRef<HTMLButtonElement>(null);

  const handleTogglePeriod = () => {
    setPeriod(!period);
  };

  const handlePeriodOption = (option: SetStateAction<string>) => {
    setPeriodOption(option);
    setPeriod(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        periodRef.current &&
        !periodRef.current.contains(event.target as Node) &&
        btnPeriodRef.current &&
        !btnPeriodRef.current.contains(event.target as Node)
      ) {
        setPeriod(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const periodOptions = ["Time Period", "Single Day"];

  //DATES

  //startDate
  const [clinicStartingDate, setClinicStartingDate] = useState(new Date());
  const [clinicStartingDatejs, setClinicStartingDatejs] = useState(dayjs(new Date()));
  //endDate
  const [clinicEndingDate, setClinicEndingDate] = useState(new Date());
  const [clinicEndingDatejs, setClinicEndingDatejs] = useState(dayjs(new Date()));

  //singleDate
  const [clinicDate, setClinicDate] = useState(new Date());
  const [clinicDatejs, setClinicDatejs] = useState(dayjs(new Date()));

  //CLINIC INFINITE SCROLLING
  const observerClinicTarget = useRef<HTMLDivElement | null>(null);

  const [limitClinic] = useState(8);
  const {
    data: queryClinicData,
    fetchNextPage: fetchNextClinicPage,
    hasNextPage: hasNextClinicPage,
    refetch: refetchClinic,
  } = api.info.getClinicInfinite.useInfiniteQuery(
    {
      limit: limitClinic,
      typeOfQuery: periodOption,
      startDate: clinicStartingDate,
      endDate: clinicEndingDate,
      singleDate: clinicDate,
      //order
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
  const clinicData = queryClinicData?.pages.flatMap((page) => page.data);

  //Checks intersection of the observer target and reassigns target element once true
  useEffect(() => {
    if (!observerClinicTarget.current || !fetchNextClinicPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextClinicPage) void fetchNextClinicPage();
      },
      { threshold: 1 },
    );

    if (observerClinicTarget.current) observer.observe(observerClinicTarget.current);

    const currentTarget = observerClinicTarget.current;

    return () => {
      if (currentTarget) observer.unobserve(currentTarget);
    };
  }, [fetchNextClinicPage, hasNextClinicPage, observerClinicTarget]);

  //for when order is implemented
  // useEffect(() => {
  //   void refetch();
  // }, [order]);

  //TREATMENT INFINITE SCROLLING
  const observerTreatmentTarget = useRef<HTMLDivElement | null>(null);

  const [limitTreatment] = useState(8);
  const {
    data: queryTreatmentData,
    fetchNextPage: fetchNextTreatmentPage,
    hasNextPage: hasNextTreatmentPage,
    refetch: refetchTreatment,
  } = api.info.getTreatmentInfinite.useInfiniteQuery(
    {
      limit: limitTreatment,
      typeOfQuery: periodOption,
      startDate: clinicStartingDate,
      endDate: clinicEndingDate,
      singleDate: clinicDate,
      //order
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
  const treatmentData = queryTreatmentData?.pages.flatMap((page) => page.data);

  //Checks intersection of the observer target and reassigns target element once true
  useEffect(() => {
    if (!observerTreatmentTarget.current || !fetchNextTreatmentPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextTreatmentPage) void fetchNextTreatmentPage();
      },
      { threshold: 1 },
    );

    if (observerTreatmentTarget.current) observer.observe(observerTreatmentTarget.current);

    const currentTarget = observerTreatmentTarget.current;

    return () => {
      if (currentTarget) observer.unobserve(currentTarget);
    };
  }, [fetchNextTreatmentPage, hasNextTreatmentPage, observerTreatmentTarget]);

  //Generate table button

  //when dropdowns are selected again the table should dissappear
  useEffect(() => {
    setGeneratedClinic(false);
  }, [clinicOption, clinicStartingDate, clinicEndingDate, periodOption, clinicDate]);

  const handleClinicGenerate = async () => {
    setIsLoading(true);
    if (clinicOption === "Clinic Attendance") {
      void refetchClinic();
      setGeneratedSterilisation(false);
      setGeneratedMembership(false);
      setGeneratedClinic(true);
    } else if (clinicOption === "Treatment Administered") {
      void refetchTreatment();
      setGeneratedSterilisation(false);
      setGeneratedMembership(false);
      setGeneratedClinic(true);
    }
    setIsLoading(false);
  };

  //Download clinics
  const downloadClinicsTable = api.info.downloadClinic.useQuery(
    {
      typeOfQuery: periodOption,
      startDate: clinicStartingDate,
      endDate: clinicEndingDate,
      singleDate: clinicDate,
    },
    { enabled: hasAccess },
  );

  //Download treatment
  const downloadTreatmentsTable = api.info.downloadTreatment.useQuery(
    {
      typeOfQuery: periodOption,
      startDate: clinicStartingDate,
      endDate: clinicEndingDate,
      singleDate: clinicDate,
    },
    { enabled: hasAccess },
  );

  //variable for checking if buttton was pressed
  const [downloadClinic, setDownloadClinic] = useState(false);

  useEffect(() => {
    if (
      ((downloadClinicsTable.isSuccess && !downloadClinicsTable.isFetching) || (downloadTreatmentsTable.isSuccess && !downloadTreatmentsTable.isFetching)) &&
      downloadClinic
    ) {
      if (clinicOption === "Clinic Attendance") {
        const data = downloadClinicsTable.data?.data;
        const fileName = `Clinic Attendance Table (${periodOption})`;
        const fileType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
        const fileExtension = ".xlsx";
        const ws = XLSX.utils.json_to_sheet(data ?? []);
        const wb = { Sheets: { data: ws }, SheetNames: ["data"] };
        const excelBuffer: Uint8Array = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as Uint8Array;
        const dataFile = new Blob([excelBuffer], { type: fileType });
        FileSaver.saveAs(dataFile, fileName + fileExtension);
        setDownloadClinic(false);
      } else if (clinicOption === "Treatment Administered") {
        const data = downloadTreatmentsTable.data?.data;
        const fileName = `Treatment Administered Table (${periodOption})`;
        const fileType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
        const fileExtension = ".xlsx";
        const ws = XLSX.utils.json_to_sheet(data ?? []);
        const wb = { Sheets: { data: ws }, SheetNames: ["data"] };
        const excelBuffer: Uint8Array = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as Uint8Array;
        const dataFile = new Blob([excelBuffer], { type: fileType });
        FileSaver.saveAs(dataFile, fileName + fileExtension);
        setDownloadClinic(false);
      }
    }
  }, [
    downloadClinicsTable.isFetched,
    downloadClinicsTable.isSuccess,
    downloadClinicsTable.isFetching,
    downloadTreatmentsTable.isFetched,
    downloadTreatmentsTable.isSuccess,
    downloadTreatmentsTable.isFetching,
  ]);

  const handleDownloadClinicTable = async () => {
    setIsLoading(true);

    if (clinicOption === "Clinic Attendance") {
      void downloadClinicsTable.refetch();
      setDownloadClinic(true);
    } else if (clinicOption === "Treatment Administered") {
      void downloadTreatmentsTable.refetch();
      setDownloadClinic(true);
    }
    // //take the download user table query data and put it in an excel file

    // if (clinicOption === "Clinic Attendance") {
    //   const data = downloadClinicsTable.data?.data;
    //   const fileName = `Clinic Attendance Table (${periodOption})`;
    //   const fileType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
    //   const fileExtension = ".xlsx";
    //   const ws = XLSX.utils.json_to_sheet(data ?? []);
    //   const wb = { Sheets: { data: ws }, SheetNames: ["data"] };
    //   const excelBuffer: Uint8Array = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as Uint8Array;
    //   const dataFile = new Blob([excelBuffer], { type: fileType });
    //   FileSaver.saveAs(dataFile, fileName + fileExtension);
    // } else if (clinicOption === "Treatment Administered") {
    //   const data = downloadTreatmentsTable.data?.data;
    //   const fileName = `Treatment Administered Table (${periodOption})`;
    //   const fileType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
    //   const fileExtension = ".xlsx";
    //   const ws = XLSX.utils.json_to_sheet(data ?? []);
    //   const wb = { Sheets: { data: ws }, SheetNames: ["data"] };
    //   const excelBuffer: Uint8Array = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as Uint8Array;
    //   const dataFile = new Blob([excelBuffer], { type: fileType });
    //   FileSaver.saveAs(dataFile, fileName + fileExtension);
    // }
    setIsLoading(false);
  };

  return (
    <>
      <Head>
        <title>Information and Retrieval</title>
      </Head>
      <main className="flex h-screen flex-col overflow-y-hidden text-normal">
        <Navbar />

        <div className="grid h-full w-full grow grid-rows-6">
          <div className="row-span-2 grid grid-rows-3">
            {/* DOWNLOAD DATABASE */}
            {/* <div className="row-span-1 flex items-center justify-center border-2">
              <button
                onClick={handleDownloadDatabase}
                className="my-2 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300 "
              >
                {downloadData ? (
                  <div
                    className="mx-2 inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-current border-white border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
                    role="status"
                  />
                ) : (
                  <div>Download Database</div>
                )}
              </button>
            </div> */}
            {/* STERILISATION DUE QUERIES */}
            <div className="row-span-1 grid grid-cols-5 border-2">
              <div className="col-span-4 grid grid-cols-2">
                <div className="col-span-1 flex justify-evenly">
                  <div className="flex items-center">
                    <div className="mx-3 flex items-center">
                      <label className="my-2 pb-1">
                        Sterilisation Due<span className="text-lg text-main-orange">*</span>:{" "}
                      </label>
                    </div>
                    <div className="relative flex flex-col">
                      <button
                        ref={btnSterilisationDueRef}
                        className="my-2 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300 "
                        type="button"
                        onClick={handleToggleSterilisationDue}
                      >
                        {sterilisationDueOption + " "}
                        <svg className="ms-3 h-2.5 w-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                        </svg>
                      </button>
                      {sterilisationDue && (
                        <div ref={sterilisationDueRef} className="absolute top-[60px] z-10 w-full divide-y divide-gray-100 rounded-lg bg-white shadow">
                          <ul className=" text-sm text-gray-700 " aria-labelledby="dropdownHoverButton">
                            {sterilisationDueOptions.map((option) => (
                              <li key={option} onClick={() => handleSterilisationDueOption(option)}>
                                <button className="block px-4 py-2 hover:bg-gray-100 ">{option}</button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* <div className="mx-3 flex items-center">
                    <div className="mx-3 flex items-center">
                      <label className="">
                        Species<span className="text-lg text-main-orange">*</span>:{" "}
                      </label>
                    </div>
                    <div className="relative flex flex-col">
                      <button
                        ref={btnSpeciesSteriliseRef}
                        className="my-3 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300 "
                        type="button"
                        onClick={handleToggleSpeciesSterilise}
                      >
                        {speciesSteriliseOption + " "}
                        <svg className="ms-3 h-2.5 w-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                        </svg>
                      </button>
                      {speciesSterilise && (
                        <div ref={speciesSteriliseRef} className="absolute top-[60px] z-10 w-full divide-y divide-gray-100 rounded-lg bg-white shadow">
                          <ul className="py-2 text-sm text-gray-700 " aria-labelledby="dropdownHoverButton">
                            {speciesSteriliseOptions.map((option) => (
                              <li key={option} onClick={() => handleSpeciesSteriliseOption(option)}>
                                <button className="block px-4 py-2 hover:bg-gray-100 ">{option}</button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div> */}

                  <div className="mx-3 flex items-center">
                    <div className="mx-3 flex items-center">
                      <label className="my-2 pb-1">
                        Species<span className="text-lg text-main-orange">*</span>:{" "}
                      </label>
                    </div>
                    <div className="relative flex flex-col">
                      <button
                        ref={btnSpeciesRef}
                        className="my-2 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300 "
                        type="button"
                        onClick={handleToggleSpecies}
                      >
                        {speciesOption + " "}
                        <svg className="ms-3 h-2.5 w-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                        </svg>
                      </button>
                      {species && (
                        <div ref={speciesRef} className="absolute top-[60px] z-10 w-full divide-y divide-gray-100 rounded-lg bg-white shadow">
                          <ul className="py-2 text-sm text-gray-700" aria-labelledby="dropdownHoverButton">
                            {specieListOptions?.map((option) => (
                              <li key={option.species}>
                                <div className="flex items-center px-4">
                                  <input
                                    id={String(option.species)}
                                    type="checkbox"
                                    checked={option.state}
                                    onChange={(e) => handleSpecie(option.species, e.target.checked)}
                                    className="h-4 w-4 rounded bg-gray-100 text-main-orange accent-main-orange focus:ring-2"
                                  />
                                  <label htmlFor={String(option.species)} className="ms-2 text-sm font-medium text-gray-900">
                                    {option.species}
                                  </label>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="col-span-1 flex items-center gap-5">
                  <div className="flex items-center">
                    <label className="my-2 pb-1">
                      From<span className="text-lg text-main-orange">*</span>:{" "}
                    </label>
                    <div className="z-50 my-2 px-4">
                      {/* MUI Datepicker */}
                      <ThemeProvider theme={theme}>
                        <Typography>
                          <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DatePicker
                              value={sterilisationStartingDatejs}
                              onChange={(datejs_) => {
                                setSterilisationStartingDatejs(datejs_ ?? dayjs(new Date()));
                                setSterilisationStartingDate(datejs_?.toDate() ?? new Date());
                              }}
                              format="DD/MM/YYYY"
                              slotProps={{ textField: { size: "small" } }}
                            />
                          </LocalizationProvider>
                        </Typography>
                      </ThemeProvider>
                      {/* <DatePicker
                        selected={sterilisationStartingDate}
                        onChange={(date) => setSterilisationStartingDate(date!)}
                        dateFormat="dd/MM/yyyy"
                        customInput={<CustomInput />}
                        className="form-input rounded-md border px-4 py-2"
                      /> */}
                    </div>
                  </div>

                  <div className="flex items-center">
                    <label className="my-2 pb-1">
                      To<span className="text-lg text-main-orange">*</span>:{" "}
                    </label>
                    <div className="z-50 my-2 px-4">
                      {/* MUI Datepicker */}
                      <ThemeProvider theme={theme}>
                        <Typography>
                          <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DatePicker
                              value={sterilisationEndingDatejs}
                              onChange={(datejs_) => {
                                setSterilisationEndingDatejs(datejs_ ?? dayjs(new Date()));
                                setSterilisationEndingDate(datejs_?.toDate() ?? new Date());
                              }}
                              format="DD/MM/YYYY"
                              slotProps={{ textField: { size: "small" } }}
                            />
                          </LocalizationProvider>
                        </Typography>
                      </ThemeProvider>
                      {/* <DatePicker
                        selected={sterilisationEndingDate}
                        onChange={(date) => setSterilisationEndingDate(date!)}
                        dateFormat="dd/MM/yyyy"
                        customInput={<CustomInput />}
                        className="form-input rounded-md border px-4 py-2"
                      /> */}
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-span-1 flex items-center justify-around">
                <button className="my-1 h-10 rounded-lg bg-main-orange px-3 text-white hover:bg-orange-500" onClick={handleSteriliseGenerate}>
                  {isLoading ? (
                    <div
                      className="mx-2 inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-current border-white border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
                      role="status"
                    />
                  ) : (
                    <div>Generate Table</div>
                  )}
                </button>

                <button className="my-1 h-10 rounded-lg bg-main-orange px-3 text-white hover:bg-orange-500" onClick={handleDownloadSterilisationTable}>
                  {downloadSterilise ? (
                    <div
                      className="mx-2 inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-current border-white border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
                      role="status"
                    />
                  ) : (
                    <div>Download Table</div>
                  )}
                </button>
              </div>
            </div>

            {/* MEMBERSHIP TYPE QUERIES */}
            <div className="row-span-1 grid grid-cols-5 border-2">
              <div className="col-span-4 grid grid-cols-2">
                <div className="col-span-1 flex justify-evenly">
                  <div className="flex items-center">
                    <div className="mx-3 flex items-center">
                      <label className="my-2 pb-1">
                        Membership Type<span className="text-lg text-main-orange">*</span>:{" "}
                      </label>
                    </div>
                    <div className="relative flex flex-col">
                      <button
                        ref={btnMembershipRef}
                        className="my-2 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300 "
                        type="button"
                        onClick={handleToggleMembership}
                      >
                        {membershipOption + " "}
                        <svg className="ms-3 h-2.5 w-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                        </svg>
                      </button>
                      {membership && (
                        <div
                          ref={membershipRef}
                          className="absolute left-1/2 top-[60px] z-10 w-40 -translate-x-1/2 divide-y divide-gray-100 rounded-lg bg-white shadow"
                        >
                          <ul className="py-2 text-sm text-gray-700 " aria-labelledby="dropdownHoverButton">
                            {membershipOptions.map((option) => (
                              <li key={option} onClick={() => handleMembershipOption(option)}>
                                <button className="block px-4 py-2 hover:bg-gray-100 ">{option}</button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* <div className="mx-3 flex items-center">
                    <div className="mx-3 flex items-center">
                      <label className="">
                        Species<span className="text-lg text-main-orange">*</span>:{" "}
                      </label>
                    </div>
                    <div className="relative flex flex-col">
                      <button
                        ref={btnSpeciesMembershipRef}
                        className="my-3 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300 "
                        type="button"
                        onClick={handleToggleSpeciesMembership}
                      >
                        {speciesMembershipOption + " "}
                        <svg className="ms-3 h-2.5 w-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                        </svg>
                      </button>
                      {speciesMembership && (
                        <div ref={speciesMembershipRef} className="absolute top-[60px] z-10 w-full divide-y divide-gray-100 rounded-lg bg-white shadow">
                          <ul className="py-2 text-sm text-gray-700 " aria-labelledby="dropdownHoverButton">
                            {speciesMembershipOptions.map((option) => (
                              <li key={option} onClick={() => handleSpeciesMembershipOption(option)}>
                                <button className="block px-4 py-2 hover:bg-gray-100 ">{option}</button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div> */}

                  <div className="mx-3 flex items-center">
                    <div className="mx-3 flex items-center">
                      <label className="my-2 pb-1">
                        Species<span className="text-lg text-main-orange">*</span>:{" "}
                      </label>
                    </div>
                    <div className="relative flex flex-col">
                      <button
                        ref={btnSpeciesMembershipRef}
                        className="my-2 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300 "
                        type="button"
                        onClick={handleToggleSpeciesMembership}
                      >
                        {speciesMembershipOption + " "}
                        <svg className="ms-3 h-2.5 w-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                        </svg>
                      </button>
                      {speciesMembership && (
                        <div ref={speciesMembershipRef} className="absolute top-[60px] z-10 w-full divide-y divide-gray-100 rounded-lg bg-white shadow">
                          <ul className="py-2 text-sm text-gray-700" aria-labelledby="dropdownHoverButton">
                            {specieMembershipListOptions?.map((option) => (
                              <li key={option.species}>
                                <div className="flex items-center px-4">
                                  <input
                                    id={String(option.species)}
                                    type="checkbox"
                                    checked={option.state}
                                    onChange={(e) => handleSpecieMembership(option.species, e.target.checked)}
                                    className="h-4 w-4 rounded bg-gray-100 text-main-orange accent-main-orange focus:ring-2"
                                  />
                                  <label htmlFor={String(option.species)} className="ms-2 text-sm font-medium text-gray-900">
                                    {option.species}
                                  </label>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="col-span-1 flex items-center gap-5">
                  <div className="flex items-center">
                    <label className="my-2 pb-1">
                      From<span className="text-lg text-main-orange">*</span>:{" "}
                    </label>
                    <div className="z-40 my-2 px-4">
                      {/* MUI Datepicker */}
                      <ThemeProvider theme={theme}>
                        <Typography>
                          <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DatePicker
                              value={membershipStartingDatejs}
                              onChange={(datejs_) => {
                                setMembershipStartingDatejs(datejs_ ?? dayjs(new Date()));
                                setMembershipStartingDate(datejs_?.toDate() ?? new Date());
                              }}
                              format="DD/MM/YYYY"
                              slotProps={{ textField: { size: "small" } }}
                            />
                          </LocalizationProvider>
                        </Typography>
                      </ThemeProvider>
                      {/* <DatePicker
                        selected={membershipStartingDate}
                        onChange={(date) => setMembershipStartingDate(date!)}
                        dateFormat="dd/MM/yyyy"
                        customInput={<CustomInput />}
                        className="form-input rounded-md border px-4 py-2"
                      /> */}
                    </div>
                  </div>

                  <div className="flex items-center">
                    <label className="my-2 pb-1">
                      To<span className="text-lg text-main-orange">*</span>:{" "}
                    </label>
                    <div className="z-40 my-2 px-4">
                      {/* MUI Datepicker */}
                      <ThemeProvider theme={theme}>
                        <Typography>
                          <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DatePicker
                              value={membershipEndingDatejs}
                              onChange={(datejs_) => {
                                setMembershipEndingDatejs(datejs_ ?? dayjs(new Date()));
                                setMembershipEndingDate(datejs_?.toDate() ?? new Date());
                              }}
                              format="DD/MM/YYYY"
                              slotProps={{ textField: { size: "small" } }}
                            />
                          </LocalizationProvider>
                        </Typography>
                      </ThemeProvider>
                      {/* <DatePicker
                        selected={membershipEndingDate}
                        onChange={(date) => setMembershipEndingDate(date!)}
                        dateFormat="dd/MM/yyyy"
                        customInput={<CustomInput />}
                        className="form-input rounded-md border px-4 py-2"
                      /> */}
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-span-1 flex items-center justify-around">
                <button className="my-1 h-10 rounded-lg bg-main-orange px-3 text-white hover:bg-orange-500" onClick={handleMembershipGenerate}>
                  {isLoading ? (
                    <div
                      className="mx-2 inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-current border-white border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
                      role="status"
                    />
                  ) : (
                    <div>Generate Table</div>
                  )}
                </button>

                <button className="my-1 h-10 rounded-lg bg-main-orange px-3 text-white hover:bg-orange-500" onClick={handleDownloadMembershipTable}>
                  {downloadMembership ? (
                    <div
                      className="mx-2 inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-current border-white border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
                      role="status"
                    />
                  ) : (
                    <div>Download Table</div>
                  )}
                </button>
              </div>
            </div>

            {/* PET CLINIC QUERIES */}
            <div className="row-span-1 grid grid-cols-5 border-2">
              <div className="col-span-4 grid grid-cols-2">
                <div className="col-span-1 flex justify-evenly">
                  <div className="flex items-center">
                    <div className="mx-3 flex items-center">
                      <label className="my-2 pb-1">
                        Pet Clinic<span className="text-lg text-main-orange">*</span>:{" "}
                      </label>
                    </div>
                    <div className="relative flex flex-col">
                      <button
                        ref={btnClinicRef}
                        className="my-2 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300 "
                        type="button"
                        onClick={handleToggleClinic}
                      >
                        {clinicOption + " "}
                        <svg className="ms-3 h-2.5 w-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                        </svg>
                      </button>
                      {clinic && (
                        <div
                          ref={clinicRef}
                          className="absolute left-1/2 top-[60px] z-30 w-44 -translate-x-1/2 divide-y divide-gray-100 rounded-lg bg-white shadow"
                        >
                          <ul className="py-2 text-sm text-gray-700 " aria-labelledby="dropdownHoverButton">
                            {clinicOptions.map((option) => (
                              <li key={option} onClick={() => handleClinicOption(option)}>
                                <button className="block px-4 py-2 hover:bg-gray-100 ">{option}</button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mx-3 flex items-center">
                    <div className="mx-3 flex items-center">
                      <label className="my-2 pb-1">
                        Time Filter<span className="text-lg text-main-orange">*</span>:{" "}
                      </label>
                    </div>
                    <div className="relative flex flex-col">
                      <button
                        ref={btnPeriodRef}
                        className="my-2 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300 "
                        type="button"
                        onClick={handleTogglePeriod}
                      >
                        {periodOption + " "}
                        <svg className="ms-3 h-2.5 w-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                        </svg>
                      </button>
                      {period && (
                        <div ref={periodRef} className="absolute top-[60px] z-30 w-full divide-y divide-gray-100 rounded-lg bg-white shadow">
                          <ul className="py-2 text-sm text-gray-700 " aria-labelledby="dropdownHoverButton">
                            {periodOptions.map((option) => (
                              <li key={option} onClick={() => handlePeriodOption(option)}>
                                <button className="block px-4 py-2 hover:bg-gray-100 ">{option}</button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {periodOption === "Time Period" ? (
                  <div className="col-span-1 flex items-center gap-5">
                    <div className="flex items-center">
                      <label className="my-2 pb-1">
                        From<span className="text-lg text-main-orange">*</span>:{" "}
                      </label>
                      <div className="z-30 my-2 px-4">
                        {/* MUI Datepicker */}
                        <ThemeProvider theme={theme}>
                          <Typography>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                              <DatePicker
                                value={clinicStartingDatejs}
                                onChange={(datejs_) => {
                                  setClinicStartingDatejs(datejs_ ?? dayjs(new Date()));
                                  setClinicStartingDate(datejs_?.toDate() ?? new Date());
                                }}
                                format="DD/MM/YYYY"
                                slotProps={{ textField: { size: "small" } }}
                              />
                            </LocalizationProvider>
                          </Typography>
                        </ThemeProvider>
                        {/* <DatePicker
                          selected={clinicStartingDate}
                          onChange={(date) => setClinicStartingDate(date!)}
                          dateFormat="dd/MM/yyyy"
                          customInput={<CustomInput />}
                          className="form-input rounded-md border px-4 py-2"
                        /> */}
                      </div>
                    </div>

                    <div className="flex items-center">
                      <label className="my-2 pb-1">
                        To<span className="text-lg text-main-orange">*</span>:{" "}
                      </label>
                      <div className="z-30 my-2 px-4">
                        {/* MUI Datepicker */}
                        <ThemeProvider theme={theme}>
                          <Typography>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                              <DatePicker
                                value={clinicEndingDatejs}
                                onChange={(datejs_) => {
                                  setClinicEndingDatejs(datejs_ ?? dayjs(new Date()));
                                  setClinicEndingDate(datejs_?.toDate() ?? new Date());
                                }}
                                format="DD/MM/YYYY"
                                slotProps={{ textField: { size: "small" } }}
                              />
                            </LocalizationProvider>
                          </Typography>
                        </ThemeProvider>
                        {/* <DatePicker
                          selected={clinicEndingDate}
                          onChange={(date) => setClinicEndingDate(date!)}
                          dateFormat="dd/MM/yyyy"
                          customInput={<CustomInput />}
                          className="form-input rounded-md border px-4 py-2"
                        /> */}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="col-span-1 flex items-center">
                    <label className="my-2 pb-1">
                      Date<span className="text-lg text-main-orange">*</span>:{" "}
                    </label>
                    <div className="z-30 my-2 px-4">
                      {/* MUI Datepicker */}
                      <ThemeProvider theme={theme}>
                        <Typography>
                          <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DatePicker
                              value={clinicDatejs}
                              onChange={(datejs_) => {
                                setClinicDatejs(datejs_ ?? dayjs(new Date()));
                                setClinicDate(datejs_?.toDate() ?? new Date());
                              }}
                              format="DD/MM/YYYY"
                              slotProps={{ textField: { size: "small" } }}
                            />
                          </LocalizationProvider>
                        </Typography>
                      </ThemeProvider>
                      {/* <DatePicker
                        selected={clinicDate}
                        onChange={(date) => setClinicDate(date!)}
                        dateFormat="dd/MM/yyyy"
                        customInput={<CustomInput />}
                        className="form-input rounded-md border px-4 py-2"
                      /> */}
                    </div>
                  </div>
                )}
              </div>

              <div className="col-span-1 flex items-center justify-around">
                <button className="my-1 h-10 rounded-lg bg-main-orange px-3 text-white hover:bg-orange-500" onClick={handleClinicGenerate}>
                  {isLoading ? (
                    <div
                      className="mx-2 inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-current border-white border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
                      role="status"
                    />
                  ) : (
                    <div>Generate Table</div>
                  )}
                </button>

                <button className="my-1 h-10 rounded-lg bg-main-orange px-3 text-white hover:bg-orange-500" onClick={handleDownloadClinicTable}>
                  {downloadClinic ? (
                    <div
                      className="mx-2 inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-current border-white border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
                      role="status"
                    />
                  ) : (
                    <div>Download Table</div>
                  )}
                </button>
              </div>
            </div>
          </div>
          {/* TABLE */}
          <div className="row-span-4 flex justify-center border-2">
            {generatedSterilisation ? (
              sterilisationData ? (
                <article className="my-3 flex w-full justify-center rounded-md shadow-inner">
                  <div className="max-h-[52vh] max-w-[85rem] overflow-auto">
                    {/* max-h-[60vh] */}
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
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2"></th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2"></th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2"></th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2"></th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2"></th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2" colSpan={2}>
                            Deworming
                          </th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2"></th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2"></th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2"></th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2"></th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2"></th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2"></th>
                        </tr>
                        <tr>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2"></th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Owner Name</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Address</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Mobile</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Pet Name</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Species</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Sex</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Age</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Breed</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Colour</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Size</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Sterilisation Requested Date</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Request Signed At</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Last</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Due</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Vaccination Shot 1 Date</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Vaccination Shot 1 Type</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Vaccination Shot 2 Date</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Vaccination Shot 2 Type</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Vaccination Shot 3 Date</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Vaccination Shot 3 Type</th>

                          {/* <th className="sticky top-0 z-10 w-[35px] bg-gray-50 px-4 py-2">
                            <span className="group relative inline-block">
                              <button className={`${order === "updatedAt" ? "underline" : ""}`} onClick={() => handleOrderFields("updatedAt")}>
                                Date
                              </button>
                              <span className="absolute right-[-20px] top-full hidden w-[110px] rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 shadow-sm group-hover:block">
                                Sort reverse chronologically
                              </span>
                            </span>
                          </th> */}
                        </tr>
                      </thead>
                      <tbody>
                        {sterilisationData?.map((user, index) => {
                          return (
                            <tr className="items-center">
                              <td className=" border px-2 py-1">
                                <div className="flex justify-center">{index + 1}</div>
                              </td>
                              <td className="border px-2 py-1">{user.owner.firstName + " " + user.owner.surname}</td>
                              <td className="border px-2 py-1">
                                {[
                                  user.owner.addressGreaterArea.greaterArea,
                                  user.owner.addressArea?.area,
                                  user.owner.addressStreet?.street,
                                  user.owner.addressStreetCode,
                                  user.owner.addressStreetNumber,
                                ]
                                  .filter((item) => item) // Only keep non-empty values
                                  .join(", ")}
                                {/* {user.owner.addressGreaterArea.greaterArea +
                                  ", " +
                                  user.owner.addressArea?.area +
                                  ", " +
                                  user.owner.addressStreet?.street +
                                  ", " +
                                  user.owner.addressStreetCode +
                                  ", " +
                                  user.owner.addressStreetNumber} */}
                              </td>
                              <td className="border px-2 py-1">{user.owner.mobile}</td>
                              <td className="border px-2 py-1">{user.petName}</td>
                              <td className="border px-2 py-1">{user.species}</td>
                              <td className="border px-2 py-1">{user.sex}</td>
                              <td className="border px-2 py-1">{user.age}</td>
                              <td className="border px-2 py-1">{user.breed.join(", ")}</td>
                              <td className="border px-2 py-1">{user.colour.join(", ")}</td>
                              <td className="border px-2 py-1">{user.size}</td>
                              <td className=" border px-2 py-1">
                                {user?.sterilisedRequested?.getFullYear() != 1970
                                  ? `${user?.sterilisedRequested?.getDate()?.toString() ?? ""}/${(user?.sterilisedRequested?.getMonth() ?? 0) + 1}/${
                                      user?.sterilisedRequested?.getFullYear()?.toString() ?? ""
                                    }`
                                  : ""}
                              </td>
                              <td className="border px-2 py-1">{user.sterilisedRequestSigned}</td>
                              <td className="border px-2 py-1">
                                {user?.lastDeworming?.getDate().toString() +
                                  "/" +
                                  ((user?.lastDeworming?.getMonth() ?? 0) + 1).toString() +
                                  "/" +
                                  user?.lastDeworming?.getFullYear().toString()}
                              </td>
                              <td className="border px-2 py-1">{isMoreThanSixMonthsAgo(user?.lastDeworming ?? new Date(), user?.species) ? "Yes" : "No"}</td>
                              <td className=" border px-2 py-1">
                                {user?.vaccinationShot1?.getFullYear() === 1970
                                  ? "Not yet"
                                  : user?.vaccinationShot1?.getFullYear() === 1971
                                    ? "Unknown"
                                    : `${user.vaccinationShot1.getDate().toString()}/` +
                                      `${(user.vaccinationShot1.getMonth() + 1).toString()}/` +
                                      `${user.vaccinationShot1.getFullYear().toString()}`}
                              </td>
                              <td className="border px-2 py-1">{user.vaccination1Type.join(", ")}</td>
                              <td className=" border px-2 py-1">
                                {user?.vaccinationShot2?.getFullYear() === 1970
                                  ? "Not yet"
                                  : user?.vaccinationShot2?.getFullYear() === 1971
                                    ? "Unknown"
                                    : `${user.vaccinationShot2?.getDate().toString()}/` +
                                      `${((user.vaccinationShot2?.getMonth() ?? 0) + 1).toString()}/` +
                                      `${user.vaccinationShot2?.getFullYear().toString()}`}
                                {/* .toString().padStart(2, "0") */}
                              </td>
                              <td className="border px-2 py-1">{user.vaccination2Type.join(", ")}</td>
                              <td className=" border px-2 py-1">
                                {user?.vaccinationShot3?.getFullYear() === 1970
                                  ? "Not yet"
                                  : user?.vaccinationShot3?.getFullYear() === 1971
                                    ? "Unknown"
                                    : `${user.vaccinationShot3?.getDate().toString()}/` +
                                      `${((user.vaccinationShot3?.getMonth() ?? 0) + 1).toString()}/` +
                                      `${user.vaccinationShot3?.getFullYear().toString()}`}
                              </td>
                              <td className="border px-2 py-1">{user.vaccination3Type.join(", ")}</td>
                            </tr>
                          );
                        })}
                        <tr>
                          <td className=" px-2 py-1">
                            <div ref={observerSterilisationTarget} />
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
              )
            ) : generatedMembership ? (
              membershipData ? (
                <article className="my-3 flex w-full justify-center rounded-md shadow-inner">
                  <div className="max-h-[52vh] max-w-[85rem] overflow-auto">
                    {/* max-h-[60vh] */}
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="z-30 bg-gray-50">
                        <tr>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2"></th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Owner Name</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Mobile</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Address</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Pet Name</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Species</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Sex</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Age</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Breed</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Colour</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Pet Status</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Membership Status</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Card Status</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Clinic Dates Attended</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Total number of Clinics Attended</th>
                          {/* <th className="sticky top-0 z-10 w-[35px] bg-gray-50 px-4 py-2">
                            <span className="group relative inline-block">
                              <button className={`${order === "updatedAt" ? "underline" : ""}`} onClick={() => handleOrderFields("updatedAt")}>
                                Date
                              </button>
                              <span className="absolute right-[-20px] top-full hidden w-[110px] rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 shadow-sm group-hover:block">
                                Sort reverse chronologically
                              </span>
                            </span>
                          </th> */}
                        </tr>
                      </thead>
                      <tbody>
                        {membershipData?.map((user, index) => {
                          return (
                            <tr className="items-center">
                              <td className=" border px-2 py-1">
                                <div className="flex justify-center">{index + 1}</div>
                              </td>
                              <td className="border px-2 py-1">{user.owner.firstName + " " + user.owner.surname}</td>
                              <td className="border px-2 py-1">{user.owner.mobile}</td>
                              <td className="border px-2 py-1">
                                {[
                                  user.owner.addressGreaterArea.greaterArea,
                                  user.owner.addressArea?.area,
                                  user.owner.addressStreet?.street,
                                  user.owner.addressStreetCode,
                                  user.owner.addressStreetNumber,
                                ]
                                  .filter((item) => item) // Only keep non-empty values
                                  .join(", ")}
                                {/* {user.owner.addressGreaterArea.greaterArea +
                                  ", " +
                                  user.owner.addressArea?.area +
                                  ", " +
                                  user.owner.addressStreet?.street +
                                  ", " +
                                  user.owner.addressStreetCode +
                                  ", " +
                                  user.owner.addressStreetNumber} */}
                              </td>
                              <td className="border px-2 py-1">{user.petName}</td>
                              <td className="border px-2 py-1">{user.species}</td>
                              <td className="border px-2 py-1">{user.sex}</td>
                              <td className="border px-2 py-1">{user.age}</td>
                              <td className="border px-2 py-1">{user.breed.join(", ")}</td>
                              <td className="border px-2 py-1">{user.colour.join(", ")}</td>
                              <td className="border px-2 py-1">{user.status}</td>
                              <td className="border px-2 py-1">
                                {membershipStatus(
                                  user.membership,
                                  user.clinicsAttended.map((clinic) => {
                                    return new Date(clinic.clinic.date);
                                  }),
                                )}
                              </td>
                              <td className="border px-2 py-1">{user.cardStatus}</td>
                              <td className=" border px-2 py-1">
                                {user.clinicsAttended
                                  ?.filter((item) => item?.clinic?.date) // Ensure the date exists
                                  .sort((a, b) => a.clinic.date.getTime() - b.clinic.date.getTime())
                                  .map((item) => formatDate(new Date(item.clinic.date))) // Convert to readable string
                                  .join(", ")}
                              </td>
                              <td className=" border px-2 py-1 text-center">{user?.clinicsAttended.length}</td>
                            </tr>
                          );
                        })}
                        <tr>
                          <td className=" px-2 py-1">
                            <div ref={observerMembershipTarget} />
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
              )
            ) : generatedClinic && clinicOption === "Clinic Attendance" ? (
              clinicData ? (
                <article className="my-3 flex w-full justify-center rounded-md shadow-inner">
                  <div className="max-h-[52vh] max-w-[85rem] overflow-auto">
                    {/* max-h-[60vh] */}
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="z-30 bg-gray-50">
                        <tr>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2"></th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Owner Name</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Address</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Cell number</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Pet Name</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Species</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Sex</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Age</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Breed</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Colour</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Size</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Sterilised</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Membership Type</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Membership Status</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Card Status</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Clinic Dates Attended</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Total number of Clinics Attended</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Last Deworming</th>
                          {/* <th className="sticky top-0 z-10 w-[35px] bg-gray-50 px-4 py-2">
                            <span className="group relative inline-block">
                              <button className={`${order === "updatedAt" ? "underline" : ""}`} onClick={() => handleOrderFields("updatedAt")}>
                                Date
                              </button>
                              <span className="absolute right-[-20px] top-full hidden w-[110px] rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 shadow-sm group-hover:block">
                                Sort reverse chronologically
                              </span>
                            </span>
                          </th> */}
                        </tr>
                      </thead>
                      <tbody>
                        {clinicData?.map((user, index) => {
                          return (
                            <tr className="items-center">
                              <td className=" border px-2 py-1">
                                <div className="flex justify-center">{index + 1}</div>
                              </td>
                              <td className="border px-2 py-1">{user.owner.firstName + " " + user.owner.surname}</td>
                              <td className="border px-2 py-1">
                                {[
                                  user.owner.addressGreaterArea.greaterArea,
                                  user.owner.addressArea?.area,
                                  user.owner.addressStreet?.street,
                                  user.owner.addressStreetCode,
                                  user.owner.addressStreetNumber,
                                ]
                                  .filter((item) => item) // Only keep non-empty values
                                  .join(", ")}
                              </td>
                              <td className="border px-2 py-1">{user.owner.mobile}</td>
                              <td className="border px-2 py-1">{user.petName}</td>
                              <td className="border px-2 py-1">{user.species}</td>
                              <td className="border px-2 py-1">{user.sex}</td>
                              <td className="border px-2 py-1">{user.age}</td>
                              <td className="border px-2 py-1">{user.breed.join(", ")}</td>
                              <td className="border px-2 py-1">{user.colour.join(", ")}</td>
                              <td className="border px-2 py-1">{user.size}</td>
                              <td className="border px-2 py-1">
                                {user.sterilisedStatus.getFullYear() != 1970 ? "Yes, " + formatDate(new Date(user.sterilisedStatus)) : "No"}
                              </td>
                              <td className="border px-2 py-1">{user.membership}</td>
                              <td className="border px-2 py-1">
                                {membershipStatus(
                                  user.membership,
                                  user.clinicsAttended.map((clinic) => {
                                    return new Date(clinic.clinic.date);
                                  }),
                                )}
                              </td>
                              <td className="border px-2 py-1">{user.cardStatus}</td>
                              <td className=" border px-2 py-1">
                                {user.clinicsAttended
                                  ?.filter((item) => item?.clinic?.date) // Ensure the date exists
                                  .sort((a, b) => a.clinic.date.getTime() - b.clinic.date.getTime())
                                  .map((item) => formatDate(new Date(item.clinic.date))) // Convert to readable string
                                  .join(", ")}
                              </td>
                              <td className=" border px-2 py-1 text-center">{user?.clinicsAttended.length}</td>
                              <td className=" border px-2 py-1">
                                {user?.lastDeworming?.getFullYear() != null ? formatDate(new Date(user?.lastDeworming)) : "No Last Deworming"}
                              </td>
                            </tr>
                          );
                        })}
                        <tr>
                          <td className=" px-2 py-1">
                            <div ref={observerClinicTarget} />
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
              )
            ) : generatedClinic && clinicOption === "Treatment Administered" ? (
              treatmentData ? (
                <article className="my-3 flex w-full justify-center rounded-md shadow-inner">
                  <div className="max-h-[52vh] max-w-[85rem] overflow-auto">
                    {/* max-h-[60vh] */}
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="z-30 bg-gray-50">
                        <tr>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2"></th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Owner Name</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Address</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Pet Name</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Species</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Sex</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Age</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Breed</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Colour</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Size</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Sterilised</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Membership Type</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Membership Status</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Card Status</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Total number of Clinics Attended</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Last Deworming</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Treatment Date</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Treatment Category</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Treatment Type</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Treatment Comments</th>
                          {/* <th className="sticky top-0 z-10 w-[35px] bg-gray-50 px-4 py-2">
                            <span className="group relative inline-block">
                              <button className={`${order === "updatedAt" ? "underline" : ""}`} onClick={() => handleOrderFields("updatedAt")}>
                                Date
                              </button>
                              <span className="absolute right-[-20px] top-full hidden w-[110px] rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 shadow-sm group-hover:block">
                                Sort reverse chronologically
                              </span>
                            </span>
                          </th> */}
                        </tr>
                      </thead>
                      <tbody>
                        {treatmentData?.map((user, index) => {
                          return (
                            <tr className="items-center">
                              <td className=" border px-2 py-1">
                                <div className="flex justify-center">{index + 1}</div>
                              </td>
                              <td className="border px-2 py-1">{user.owner.firstName + " " + user.owner.surname}</td>
                              <td className="border px-2 py-1">
                                {[
                                  user.owner.addressGreaterArea.greaterArea,
                                  user.owner.addressArea?.area,
                                  user.owner.addressStreet?.street,
                                  user.owner.addressStreetCode,
                                  user.owner.addressStreetNumber,
                                ]
                                  .filter((item) => item) // Only keep non-empty values
                                  .join(", ")}
                                {/* {user.owner.addressGreaterArea.greaterArea +
                                  ", " +
                                  user.owner.addressArea?.area +
                                  ", " +
                                  user.owner.addressStreet?.street +
                                  ", " +
                                  user.owner.addressStreetCode +
                                  ", " +
                                  user.owner.addressStreetNumber} */}
                              </td>
                              <td className="border px-2 py-1">{user.petName}</td>
                              <td className="border px-2 py-1">{user.species}</td>
                              <td className="border px-2 py-1">{user.sex}</td>
                              <td className="border px-2 py-1">{user.age}</td>
                              <td className="border px-2 py-1">{user.breed.join(", ")}</td>
                              <td className="border px-2 py-1">{user.colour.join(", ")}</td>
                              <td className="border px-2 py-1">{user.size}</td>
                              <td className="border px-2 py-1">
                                {user.sterilisedStatus.getFullYear() != 1970 ? "Yes, " + formatDate(new Date(user.sterilisedStatus)) : "No"}
                              </td>
                              <td className="border px-2 py-1">{user.membership}</td>
                              <td className="border px-2 py-1">
                                {membershipStatus(
                                  user.membership,
                                  user.clinicsAttended.map((clinic) => {
                                    return new Date(clinic.clinic.date);
                                  }),
                                )}
                              </td>
                              <td className="border px-2 py-1">{user.cardStatus}</td>
                              <td className=" border px-2 py-1 text-center">{user?.clinicsAttended.length}</td>
                              <td className=" border px-2 py-1">
                                {user?.lastDeworming?.getFullYear() != null ? formatDate(new Date(user?.lastDeworming)) : "No Last Deworming"}
                              </td>
                              <td className=" border px-2 py-1">
                                {user.petTreatments
                                  ?.filter((item) => item?.date) // Ensure the date exists
                                  .sort((a, b) => a.date.getTime() - b.date.getTime())
                                  .map((item) => formatDate(new Date(item.date))) // Convert to readable string
                                  .join(", ")}
                              </td>
                              <td className=" border px-2 py-1">
                                {user.petTreatments
                                  ?.filter((item) => item?.category) // Ensure the date exists
                                  .map((item) => {
                                    return <div>{item.category}.</div>;
                                  }) // Convert to readable string
                                }
                              </td>
                              <td className=" border px-2 py-1">
                                {user.petTreatments
                                  ?.filter((item) => item?.type) // Ensure the date exists
                                  .map((item) => {
                                    return <div>{item.type.map((type) => type?.type?.type).join(", ")}.</div>;
                                  }) // Convert to readable string
                                }
                              </td>
                              <td className=" border px-2 py-1">
                                {user.petTreatments
                                  ?.filter((item) => item?.comments) // Ensure the date exists
                                  .map((item) => {
                                    return <div>{item?.comments}.</div>;
                                  }) // Convert to readable string
                                }
                              </td>
                            </tr>
                          );
                        })}
                        <tr>
                          <td className=" px-2 py-1">
                            <div ref={observerTreatmentTarget} />
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
              )
            ) : (
              <div></div>
            )}
          </div>
        </div>
      </main>
    </>
  );
};

export default Info;
