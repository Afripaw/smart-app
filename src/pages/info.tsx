import { type NextPage } from "next";
import Head from "next/head";
import React, { SetStateAction, useEffect, useRef, useState } from "react";
//import { api } from "~/utils/api";
import Navbar from "../components/navbar";
import { useSession } from "next-auth/react";
import { api } from "~/utils/api";
//Date picker
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

//Excel
import * as XLSX from "xlsx";

//File saver
//import FileSaver from "file-saver";
import * as FileSaver from "file-saver";

//permissions
import usePageAccess from "../hooks/usePageAccess";

const Info: NextPage = () => {
  //checks user session and page access
  useSession({ required: true });
  const hasAccess = usePageAccess(["System Administrator", "Data Analyst", "Data Consumer"]);

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

  //Checks if card status of membership is lapsed or active
  const membershipStatus = (membershipType: string, clinicsAttended: Date[]): string => {
    if (membershipType === "Standard card holder" || membershipType === "Gold card holder") {
      const currentDate = new Date();

      // // Convert clinicList dates to Date objects
      // const clinicDates = clinicsAttended.map((clinicDate) => {
      //   const [day, month, year] = clinicDate.clinic.date.split("/").map(Number);
      //   return new Date(year ?? 0, (month ?? 0) - 1, day);
      // });

      // Filter clinics within the last 'time' months
      const filteredClinicsLapsedMember = clinicsAttended.filter((clinicDate) => {
        const pastDate = new Date(currentDate);
        pastDate.setMonth(currentDate.getMonth() - 3);
        return clinicDate >= pastDate;
      });

      const filteredClinicsActiveMember = clinicsAttended.filter((clinicDate) => {
        const pastDate = new Date(currentDate);
        pastDate.setMonth(currentDate.getMonth() - 6);
        return clinicDate >= pastDate;
      });

      if (filteredClinicsLapsedMember.length < 1) {
        //setCardStatusOption("Lapsed card holder");
        return "Lapsed";
      } else if (filteredClinicsActiveMember.length >= 3) {
        return "Active";
      } else {
        return "Not Applicable";
      }
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
  //endDate
  const [sterilisationEndingDate, setSterilisationEndingDate] = useState(new Date());

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

  //SPECIES
  const [speciesSterilise, setSpeciesSterilise] = useState(false);
  const [speciesSteriliseOption, setSpeciesSteriliseOption] = useState("Select one");
  const speciesSteriliseRef = useRef<HTMLDivElement>(null);
  const btnSpeciesSteriliseRef = useRef<HTMLButtonElement>(null);

  const handleToggleSpeciesSterilise = () => {
    setSpeciesSterilise(!speciesSterilise);
  };

  const handleSpeciesSteriliseOption = (option: SetStateAction<string>) => {
    setSpeciesSteriliseOption(option);
    setSpeciesSterilise(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        speciesSteriliseRef.current &&
        !speciesSteriliseRef.current.contains(event.target as Node) &&
        btnSpeciesSteriliseRef.current &&
        !btnSpeciesSteriliseRef.current.contains(event.target as Node)
      ) {
        setSpeciesSterilise(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const speciesSteriliseOptions = ["Dog", "Cat"];

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
      species: speciesSteriliseOption,
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
  }, [sterilisationDueOption, sterilisationStartingDate, sterilisationEndingDate, speciesSteriliseOption]);

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
      species: speciesSteriliseOption,
    },
    { enabled: hasAccess },
  );

  //variable for checking if buttton was pressed
  const [downloadSterilise, setDownloadSterilise] = useState(false);

  useEffect(() => {
    if (downloadSterilisationTable.isSuccess && !downloadSterilisationTable.isFetching && downloadSterilise) {
      //take the download user table query data and put it in an excel file
      const data = downloadSterilisationTable.data?.data;

      console.log("Sterilisation Data: ", data);
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
  //endDate
  const [membershipEndingDate, setMembershipEndingDate] = useState(new Date());

  //SPECIES
  const [speciesMembership, setSpeciesMembership] = useState(false);
  const [speciesMembershipOption, setSpeciesMembershipOption] = useState("Select one");
  const speciesMembershipRef = useRef<HTMLDivElement>(null);
  const btnSpeciesMembershipRef = useRef<HTMLButtonElement>(null);

  const handleToggleSpeciesMembership = () => {
    setSpeciesMembership(!speciesMembership);
  };

  const handleSpeciesMembershipOption = (option: SetStateAction<string>) => {
    setSpeciesMembershipOption(option);
    setSpeciesMembership(false);
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

  const speciesMembershipOptions = ["Dog", "Cat"];

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
      species: speciesMembershipOption,
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
  }, [membershipOption, membershipStartingDate, membershipEndingDate, speciesMembershipOption]);

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
      species: speciesMembershipOption,
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
  //endDate
  const [clinicEndingDate, setClinicEndingDate] = useState(new Date());

  //singleDate
  const [clinicDate, setClinicDate] = useState(new Date());

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
            {/* STERILISATION DUE QUERIES */}
            <div className="row-span-1 grid grid-cols-5 border-2">
              <div className="col-span-4 grid grid-cols-2">
                <div className="col-span-1 flex justify-evenly">
                  <div className="flex items-center">
                    <div className="mx-3 flex items-center">
                      <label className="">
                        Sterilisation Due<span className="text-lg text-main-orange">*</span>:{" "}
                      </label>
                    </div>
                    <div className="relative flex flex-col">
                      <button
                        ref={btnSterilisationDueRef}
                        className="my-3 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300 "
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
                          <ul className="py-2 text-sm text-gray-700 " aria-labelledby="dropdownHoverButton">
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

                  <div className="mx-3 flex items-center">
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
                  </div>
                </div>

                <div className="col-span-1 flex items-center gap-5">
                  <div className="flex items-center">
                    <label className="">
                      From<span className="text-lg text-main-orange">*</span>:{" "}
                    </label>
                    <div className="z-50 p-4">
                      <DatePicker
                        selected={sterilisationStartingDate}
                        onChange={(date) => setSterilisationStartingDate(date!)}
                        dateFormat="dd/MM/yyyy"
                        customInput={<CustomInput />}
                        className="form-input rounded-md border px-4 py-2"
                      />
                    </div>
                  </div>

                  <div className="flex items-center">
                    <label className="">
                      To<span className="text-lg text-main-orange">*</span>:{" "}
                    </label>
                    <div className="z-50 p-4">
                      <DatePicker
                        selected={sterilisationEndingDate}
                        onChange={(date) => setSterilisationEndingDate(date!)}
                        dateFormat="dd/MM/yyyy"
                        customInput={<CustomInput />}
                        className="form-input rounded-md border px-4 py-2"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-span-1 flex items-center justify-around">
                <button className="h-12 rounded-lg bg-main-orange px-3 text-white hover:bg-orange-500" onClick={handleSteriliseGenerate}>
                  {isLoading ? (
                    <div
                      className="mx-2 inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-current border-white border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
                      role="status"
                    />
                  ) : (
                    <div>Generate Table</div>
                  )}
                </button>

                <button className="h-12 rounded-lg bg-main-orange px-3 text-white hover:bg-orange-500" onClick={handleDownloadSterilisationTable}>
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
                      <label className="">
                        Membership Type<span className="text-lg text-main-orange">*</span>:{" "}
                      </label>
                    </div>
                    <div className="relative flex flex-col">
                      <button
                        ref={btnMembershipRef}
                        className="my-3 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300 "
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

                  <div className="mx-3 flex items-center">
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
                  </div>
                </div>

                <div className="col-span-1 flex items-center gap-5">
                  <div className="flex items-center">
                    <label className="">
                      From<span className="text-lg text-main-orange">*</span>:{" "}
                    </label>
                    <div className="z-40 p-4">
                      <DatePicker
                        selected={membershipStartingDate}
                        onChange={(date) => setMembershipStartingDate(date!)}
                        dateFormat="dd/MM/yyyy"
                        customInput={<CustomInput />}
                        className="form-input rounded-md border px-4 py-2"
                      />
                    </div>
                  </div>

                  <div className="flex items-center">
                    <label className="">
                      To<span className="text-lg text-main-orange">*</span>:{" "}
                    </label>
                    <div className="z-40 p-4">
                      <DatePicker
                        selected={membershipEndingDate}
                        onChange={(date) => setMembershipEndingDate(date!)}
                        dateFormat="dd/MM/yyyy"
                        customInput={<CustomInput />}
                        className="form-input rounded-md border px-4 py-2"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-span-1 flex items-center justify-around">
                <button className="h-12 rounded-lg bg-main-orange px-3 text-white hover:bg-orange-500" onClick={handleMembershipGenerate}>
                  {isLoading ? (
                    <div
                      className="mx-2 inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-current border-white border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
                      role="status"
                    />
                  ) : (
                    <div>Generate Table</div>
                  )}
                </button>

                <button className="h-12 rounded-lg bg-main-orange px-3 text-white hover:bg-orange-500" onClick={handleDownloadMembershipTable}>
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
                      <label className="">
                        Pet Clinic<span className="text-lg text-main-orange">*</span>:{" "}
                      </label>
                    </div>
                    <div className="relative flex flex-col">
                      <button
                        ref={btnClinicRef}
                        className="my-3 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300 "
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
                      <label className="">
                        Time Filter<span className="text-lg text-main-orange">*</span>:{" "}
                      </label>
                    </div>
                    <div className="relative flex flex-col">
                      <button
                        ref={btnPeriodRef}
                        className="my-3 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300 "
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
                      <label className="">
                        From<span className="text-lg text-main-orange">*</span>:{" "}
                      </label>
                      <div className="z-30 p-4">
                        <DatePicker
                          selected={clinicStartingDate}
                          onChange={(date) => setClinicStartingDate(date!)}
                          dateFormat="dd/MM/yyyy"
                          customInput={<CustomInput />}
                          className="form-input rounded-md border px-4 py-2"
                        />
                      </div>
                    </div>

                    <div className="flex items-center">
                      <label className="">
                        To<span className="text-lg text-main-orange">*</span>:{" "}
                      </label>
                      <div className="z-30 p-4">
                        <DatePicker
                          selected={clinicEndingDate}
                          onChange={(date) => setClinicEndingDate(date!)}
                          dateFormat="dd/MM/yyyy"
                          customInput={<CustomInput />}
                          className="form-input rounded-md border px-4 py-2"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="col-span-1 flex items-center">
                    <label className="">
                      Date<span className="text-lg text-main-orange">*</span>:{" "}
                    </label>
                    <div className="z-30 p-4">
                      <DatePicker
                        selected={clinicDate}
                        onChange={(date) => setClinicDate(date!)}
                        dateFormat="dd/MM/yyyy"
                        customInput={<CustomInput />}
                        className="form-input rounded-md border px-4 py-2"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="col-span-1 flex items-center justify-around">
                <button className="h-12 rounded-lg bg-main-orange px-3 text-white hover:bg-orange-500" onClick={handleClinicGenerate}>
                  {isLoading ? (
                    <div
                      className="mx-2 inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-current border-white border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
                      role="status"
                    />
                  ) : (
                    <div>Generate Table</div>
                  )}
                </button>

                <button className="h-12 rounded-lg bg-main-orange px-3 text-white hover:bg-orange-500" onClick={handleDownloadClinicTable}>
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
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Sterilisation Requested Date</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Request Signed At</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Vaccination Shot 1 Date</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Vaccination Shot 2 Date</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Vaccination Shot 3 Date</th>
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
                                {user?.sterilisedRequested?.getDate()?.toString() ?? ""}
                                {"/"}
                                {((user?.sterilisedRequested?.getMonth() ?? 0) + 1)?.toString() ?? ""}
                                {"/"}
                                {user?.sterilisedRequested?.getFullYear()?.toString() ?? ""}
                              </td>
                              <td className="border px-2 py-1">{user.sterilisedRequestSigned}</td>
                              <td className=" border px-2 py-1">
                                {user?.vaccinationShot1?.getFullYear() !== 1970
                                  ? `${user.vaccinationShot1.getDate().toString().padStart(2, "0")}/` +
                                    `${(user.vaccinationShot1.getMonth() + 1).toString().padStart(2, "0")}/` +
                                    `${user.vaccinationShot1.getFullYear().toString()}`
                                  : "Not yet"}
                              </td>
                              <td className=" border px-2 py-1">
                                {user?.vaccinationShot2?.getFullYear() !== 1970
                                  ? `${user.vaccinationShot2?.getDate().toString().padStart(2, "0")}/` +
                                    `${((user.vaccinationShot2?.getMonth() ?? 0) + 1).toString().padStart(2, "0")}/` +
                                    `${user.vaccinationShot2?.getFullYear().toString()}`
                                  : "Not yet"}
                              </td>
                              <td className=" border px-2 py-1">
                                {user?.vaccinationShot3?.getFullYear() !== 1970
                                  ? `${user.vaccinationShot3?.getDate().toString().padStart(2, "0")}/` +
                                    `${((user.vaccinationShot3?.getMonth() ?? 0) + 1).toString().padStart(2, "0")}/` +
                                    `${user.vaccinationShot3?.getFullYear().toString()}`
                                  : "Not yet"}
                              </td>
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
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Address</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Pet Name</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Species</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Sex</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Age</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Breed</th>
                          <th className="sticky top-0 z-10 bg-gray-50 px-4 py-2">Colour</th>
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
