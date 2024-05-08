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

const Info: NextPage = () => {
  useSession({ required: true });

  //Loading
  const [isLoading, setIsLoading] = useState(false);
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

  const sterilisationDueOptions = ["Requested", "Actioned", "No show"];

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
  const observerTarget = useRef<HTMLDivElement | null>(null);

  const [limit] = useState(8);
  const {
    data: queryData,
    fetchNextPage,
    hasNextPage,
    refetch,
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
  const data = queryData?.pages.flatMap((page) => page.data);

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

  //for when order is implemented
  // useEffect(() => {
  //   void refetch();
  // }, [order]);

  //Generate table button
  const [generated, setGenerated] = useState(false);

  //when dropdowns are selected again the table should dissappear
  useEffect(() => {
    setGenerated(false);
  }, [sterilisationDueOption, sterilisationStartingDate, sterilisationEndingDate, speciesSteriliseOption]);

  const handleSteriliseGenerate = async () => {
    setIsLoading(true);
    void refetch();
    setGenerated(true);
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

  const membershipOptions = ["Standard card holder", "Gold card holder"];

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

  //Generate table button
  const handleMembershipGenerate = async () => {
    //setIsLoading(true);
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

  const periodOptions = ["Period", "Single Day"];

  //DATES
  // const [periodSelection, setPeriodSelection] = useState(true);
  // //select period of time for clinic dates
  // useEffect(() => {
  //   if (periodOption === "Single Day") {
  //     setPeriodSelection(false);
  //   }
  // }, [periodOption]);

  //startDate
  const [clinicStartingDate, setClinicStartingDate] = useState(new Date());
  //endDate
  const [clinicEndingDate, setClinicEndingDate] = useState(new Date());

  //singleDate
  const [clinicDate, setClinicDate] = useState(new Date());

  //Generate table button
  const handleClinicGenerate = async () => {
    //setIsLoading(true);
    setIsLoading(false);
  };

  return (
    <>
      <Head>
        <title>Information and Retrieval</title>
      </Head>
      <main className="flex h-screen flex-col overflow-y-hidden text-normal">
        <Navbar />

        <div className="grid h-full w-full grow grid-rows-2">
          <div className="row-span-1 grid grid-rows-3">
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

              <div className="col-span-1 flex items-center justify-center">
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

              <div className="col-span-1 flex items-center justify-center">
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
                        Time Period<span className="text-lg text-main-orange">*</span>:{" "}
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

                {periodOption === "Period" ? (
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

              <div className="col-span-1 flex items-center justify-center">
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
              </div>
            </div>
          </div>
          {/* TABLE */}
          <div className="row-span-1 flex justify-center border-2">
            {generated ? (
              data ? (
                <article className="my-5 flex w-full justify-center rounded-md shadow-inner">
                  <div className="max-h-[70vh] max-w-[82rem] overflow-auto">
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
                        {data?.map((user, index) => {
                          return (
                            <tr className="items-center">
                              <td className=" border px-2 py-1">
                                <div className="flex justify-center">{index + 1}</div>
                              </td>
                              <td className="border px-2 py-1">{user.owner.firstName + " " + user.owner.surname}</td>
                              <td className="border px-2 py-1">
                                {user.owner.addressGreaterArea.greaterArea +
                                  ", " +
                                  user.owner.addressArea?.area +
                                  ", " +
                                  user.owner.addressStreet?.street +
                                  ", " +
                                  user.owner.addressStreetCode +
                                  ", " +
                                  user.owner.addressStreetNumber}
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
                                {user?.vaccinationShot1?.getDate()?.toString() ?? ""}
                                {"/"}
                                {((user?.vaccinationShot1?.getMonth() ?? 0) + 1)?.toString() ?? ""}
                                {"/"}
                                {user?.vaccinationShot1?.getFullYear()?.toString() ?? ""}
                              </td>
                              <td className=" border px-2 py-1">
                                {user?.vaccinationShot2?.getDate()?.toString() ?? ""}
                                {"/"}
                                {((user?.vaccinationShot2?.getMonth() ?? 0) + 1)?.toString() ?? ""}
                                {"/"}
                                {user?.vaccinationShot2?.getFullYear()?.toString() ?? ""}
                              </td>
                              <td className=" border px-2 py-1">
                                {user?.vaccinationShot3?.getDate()?.toString() ?? ""}
                                {"/"}
                                {((user?.vaccinationShot3?.getMonth() ?? 0) + 1)?.toString() ?? ""}
                                {"/"}
                                {user?.vaccinationShot3?.getFullYear()?.toString() ?? ""}
                              </td>
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
              )
            ) : (
              <div></div>
            )}
          </div>
        </div>

        {/* Seven queries attempt */}
        {/* <div className="grid-rows-7 grid h-full w-full grow">
          <div className="row-span-3 grid grid-rows-3">
            <div className="row-span-1 grid grid-cols-2 justify-around">
              <div className="col-span-1 flex grow justify-center border-2 text-center">First query</div>
              <div className="col-span-1 flex h-full grow justify-center border-2 text-center">Second query</div>
            </div>
            <div className="row-span-1 grid grid-cols-2">
              <div className="col-span-1 flex h-full grow justify-center border-2 text-center">Third query</div>
              <div className="col-span-1 flex h-full grow justify-center border-2 text-center">Fourth query</div>
            </div>
            <div className="row-span-1 grid grid-cols-2">
              <div className="col-span-1 flex h-full grow justify-center border-2 text-center">Fifth query</div>
              <div className="col-span-1 flex h-full grow justify-center border-2 text-center">Sixth query</div>
            </div>
          </div>

          <div className="row-span-1 flex justify-center">
            <div className="flex w-[50%] justify-center border-2 text-center">Seventh query</div>
          </div>

         
          <div className="row-span-3 flex w-full grow justify-center bg-slate-300">TABLE</div>
        </div> */}
      </main>
    </>
  );
};

export default Info;
