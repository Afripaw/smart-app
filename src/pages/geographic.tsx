import { type NextPage } from "next";
import Head from "next/head";
import { useEffect, useRef, useState, SetStateAction } from "react";
import { api } from "~/utils/api";
import ReactToPrint from "react-to-print";
import Image from "next/image";
import { useRouter } from "next/router";

//Components
import Navbar from "../components/navbar";
import CreateButtonModal from "../components/createButtonModal";
import DeleteButtonModal from "~/components/deleteButtonModal";
//import { areaOptions } from "~/components/GeoLocation/areaOptions";
import { areaStreetMapping } from "~/components/GeoLocation/areaStreetMapping";

//Icons
import { AddressBook, Pencil, Dog, Printer, Trash, UserCircle, Users } from "phosphor-react";

//Excel
import * as XLSX from "xlsx";

//File saver
//import FileSaver from "file-saver";
import * as FileSaver from "file-saver";
import { Area } from "recharts";
import { set } from "date-fns";
import React from "react";

const Geographic: NextPage = () => {
  type GreaterArea = {
    id: number;
    name: string;
  };

  type Area = {
    id: number;
    name: string;
    greaterAreaID: number;
    selected: boolean;
  };

  type Street = {
    id: number;
    name: string;
    areaID: number;
    selected: boolean;
  };

  const [isCreate, setIsCreate] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [isViewProfilePage, setIsViewProfilePage] = useState(false);
  const [isLoadingGreaterArea, setIsLoadingGreaterArea] = useState(false);
  const [isLoadingArea, setIsLoadingArea] = useState(false);
  const [isLoadingStreet, setIsLoadingStreet] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [order, setOrder] = useState("updatedAt");

  const [updatedAt, setUpdatedAt] = useState<Date>();
  const [greaterArea, setGreaterArea] = useState<GreaterArea>();
  const [areaList, setAreaList] = useState<Area[]>([]);
  const [streetList, setStreetList] = useState<Street[]>([]);

  const [selectedStreetList, setSelectedStreetList] = useState<Street[]>([]);

  const [areaOption, setAreaOption] = useState<Area>();
  const [streetOption, setStreetOption] = useState<Street>();

  //UPLOAD AREAS AND STREETS
  const upload = api.geographic.upload.useMutation();
  const uploadButton = async () => {
    setIsLoading(true);
    await upload.mutateAsync();
    setIsLoading(false);
  };

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

    //console.log(phrase);

    return phrase;
  };

  //-------------------------------TABLE-----------------------------------------
  //const data = api.user.searchUsers.useQuery({ searchQuery: query });
  //delete specific row
  const deleteRow = api.geographic.deleteGreaterArea.useMutation();
  const handleDeleteRow = async (id: number) => {
    setIsDeleteModalOpen(false);
    await deleteRow.mutateAsync({ greaterAreaID: id });
    isDeleted ? setIsDeleted(false) : setIsDeleted(true);
  };

  //-------------------------------INFINITE SCROLLING WITH INTERSECTION OBSERVER-----------------------------------------
  const observerTarget = useRef<HTMLDivElement | null>(null);

  const [limit] = useState(12);
  const {
    data: queryData,
    fetchNextPage,
    hasNextPage,
    refetch,
  } = api.geographic.searchInfinite.useInfiniteQuery(
    {
      //greaterArea: id,
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
  const geographic_data = queryData?.pages.flatMap((page) => page.geographic_data);

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

  const geographic = geographic_data?.find((geo) => geo.greaterAreaID === (greaterArea?.id ?? 0));

  //-------------------------------CREATE-----------------------------------------
  const newGreaterArea = api.geographic.createGreaterArea.useMutation();
  const newArea = api.geographic.createArea.useMutation();
  const newStreet = api.geographic.createStreet.useMutation();
  //-------------------------------UPDATE-----------------------------------------
  const updateGreaterArea = api.geographic.updateGreaterArea.useMutation();
  const updateArea = api.geographic.updateArea.useMutation();
  const updateStreet = api.geographic.updateStreet.useMutation();

  //---------------------------------PRINTING----------------------------------
  const printComponentRef = useRef(null);

  //-------------------------------UPDATE IDENTIFICATION-----------------------------------------
  const updateIdentification = api.communication.updateIdentification.useMutation();

  //GREATER AREA
  const handleGreaterArea = (name: string) => {
    setGreaterArea({ id: greaterArea?.id ?? 0, name: name });
  };

  //AREA
  const [showArea, setShowArea] = useState(false);
  const handleShowArea = () => {
    setShowArea(!showArea);
  };

  const handleAreaInput = (name: string) => {
    setAreaOption({ id: 0, name: name, greaterAreaID: greaterArea?.id ?? 0, selected: false });
  };

  const handleSelectedArea = (id: number) => {
    areaList.map((area) => {
      if (area.id === id) {
        area.selected = true;
      } else {
        area.selected = false;
      }
    });
    setAreaOption(areaList.find((area) => area.id === id));

    //set the street list to the selected area
    const selectedStreet = streetList.filter((street) => street.areaID === id);
    setSelectedStreetList(selectedStreet);
  };

  //STREET

  //Show all streets
  const [showStreet, setShowStreet] = useState(false);
  const handleShowStreet = () => {
    setShowStreet(!showStreet);
  };

  // const streetRef = React.createRef<HTMLButtonElement>();
  // //const btnStreetRef = useRef<HTMLDivElement>(null);
  // const btnStreetRef = React.createRef<HTMLButtonElement>();
  // useEffect(() => {
  //   const handleClickOutside = (event: MouseEvent) => {
  //     if (
  //       streetRef.current &&
  //       !streetRef.current.contains(event.target as Node) &&
  //       btnStreetRef.current &&
  //       !btnStreetRef.current.contains(event.target as Node)
  //     ) {
  //       setShowStreet(false);
  //     }
  //   };

  //   document.addEventListener("mousedown", handleClickOutside);
  //   return () => {
  //     document.removeEventListener("mousedown", handleClickOutside);
  //   };
  // }, []);

  //street edit box
  const handleStreetInput = (name: string) => {
    setStreetOption({ id: 0, name: name, areaID: areaOption?.id ?? 0, selected: false });
  };

  const handleSelectedStreet = (id: number) => {
    selectedStreetList.map((street) => {
      if (street.id === id) {
        street.selected = true;
      } else {
        street.selected = false;
      }
    });
    setStreetOption(selectedStreetList.find((street) => street.id === id));
  };

  //------------------------------------CREATE, UPDATE, VIEW PROFILE OPERATIONS-------------------------------------
  //-------------------------------NEW USER PAGE-----------------------------------------

  const handleCreateNewUser = async () => {
    // setGreaterArea({ id: 0, name: "" });
    // setAreaList([{ id: 0, name: "", greaterAreaID: 0 }]);
    // setStreetList([{ id: 0, name: "", areaID: 0 }]);
    setGreaterArea({ id: 0, name: "" });
    setAreaList([]);
    setStreetList([]);
    setAreaOption({ id: 0, name: "", greaterAreaID: 0, selected: false });
    setStreetOption({ id: 0, name: "", areaID: 0, selected: false });

    setIsCreate(true);
  };
  //-------------------------------CREATE NEW USER IN DATABASE-----------------------------------------
  //CREATE NEW GREATER AREA
  const handleNewGreaterArea = async () => {
    setIsLoadingGreaterArea(true);

    //Create new greater area
    const newGreaterArea_ = await newGreaterArea.mutateAsync({
      greaterArea: greaterArea?.name ?? "",
    });

    setGreaterArea({ id: newGreaterArea_.greaterAreaID, name: newGreaterArea_.greaterArea });
    setIsLoadingGreaterArea(false);
  };

  //CREATE NEW AREA
  const handleNewArea = async () => {
    setIsLoadingArea(true);

    const area = await newArea.mutateAsync({
      greaterAreaID: greaterArea?.id ?? 0,
      area: areaOption?.name ?? "",
    });

    const area_ = { id: area.areaID, name: area.area, greaterAreaID: area.greaterAreaID, selected: false };

    setAreaList([...areaList, area_]);

    setAreaOption({ id: 0, name: "", greaterAreaID: 0, selected: false });
    setIsLoadingArea(false);
  };

  //CREATE NEW STREET
  const handleNewStreets = async () => {
    setIsLoadingStreet(true);

    const street = await newStreet.mutateAsync({
      areaID: areaOption?.id ?? 0,
      street: streetOption?.name ?? "",
    });

    const street_ = { id: street.streetID, name: street.street, areaID: street.areaID, selected: false };

    setStreetList([...streetList, street_]);

    setStreetOption({ id: 0, name: "", areaID: 0, selected: false });

    setIsLoadingStreet(false);
  };

  //-------------------------------UPDATE USER PAGE-----------------------------------------
  const handleUpdatePage = async (id: number) => {
    setIsLoading(true);
    const geographic = geographic_data?.find((geographic: { greaterAreaID: number }) => geographic.greaterAreaID === id);
    if (geographic) {
      setGreaterArea({ id: geographic.greaterAreaID, name: geographic.greaterArea });

      const areas = geographic.area.map((area) => {
        return { id: area.areaID, name: area.area, greaterAreaID: area.greaterAreaID, selected: false };
      });

      const streets = geographic.area.map((street) => {
        return street.street.map((street) => {
          return { id: street.streetID, name: street.street, areaID: street.areaID, selected: false };
        });
      });

      //flatmap the streets
      const flatStreets = streets.flat();

      setAreaList(areas);

      setStreetList(flatStreets);

      setUpdatedAt(geographic.updatedAt);

      setIsCreate(false);

      setIsViewProfilePage(false);

      setIsUpdate(true);

      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (geographic) {
      const userData = geographic;

      const greaterAreas = { id: userData.greaterAreaID, name: userData.greaterArea };
      // map((area) => {
      //   return { id: area.greaterArea.greaterAreaID, name: area.greaterArea.greaterArea };
      // });

      const areas = userData.area.map((area) => {
        return { id: area.areaID, name: area.area, greaterAreaID: area.greaterAreaID, selected: false };
      });

      const streets = userData.area.map((street) => {
        return street.street.map((street) => {
          return { id: street.streetID, name: street.street, areaID: street.areaID, selected: false };
        });
      });

      //flatmap the streets
      const flatStreets = streets.flat();

      setGreaterArea(greaterAreas);
      setAreaList(areas);
      setStreetList(flatStreets);
    }
    // setIsCreate(false);
    // setIsUpdate(false);
    // setIsViewProfilePage(true);
  }, [isUpdate]); // Effect runs when userQuery.data changes

  //-------------------------------UPDATE USER IN DATABASE-----------------------------------------
  //UPDATE GREATER AREA
  const handleUpdateGreaterArea = async () => {
    setIsLoadingGreaterArea(true);
    //Update greater area
    const area = await updateGreaterArea.mutateAsync({
      greaterAreaID: greaterArea?.id ?? 0,
      greaterArea: greaterArea?.name ?? "",
    });

    setGreaterArea({ id: area.greaterAreaID, name: area.greaterArea });
    setIsLoadingGreaterArea(false);
  };

  //UPDATE AREA
  const handleUpdateArea = async () => {
    setIsLoadingArea(true);
    //get selected area
    const selectedArea = areaList.find((area) => area.selected === true);
    //Update area
    await updateArea.mutateAsync({
      areaID: selectedArea?.id ?? 0,
      area: areaOption?.name ?? "",
    });

    setIsLoadingArea(false);
  };

  //UPDATE STREET
  const handleUpdateStreet = async () => {
    setIsLoadingStreet(true);
    //get selected street
    const selectedStreet = streetList.find((street) => street.selected === true);
    //Update street
    //console.log("Selected street: ", selectedStreet);
    await updateStreet.mutateAsync({
      streetID: selectedStreet?.id ?? 0,
      street: streetOption?.name ?? "",
    });

    setIsLoadingStreet(false);
  };

  //-------------------------------VIEW PROFILE PAGE-----------------------------------------
  const handleViewProfilePage = async (id: number, name: string) => {
    setIsLoading(true);
    setIsViewProfilePage(true);
    setGreaterArea({ id: id, name: name });

    const geographic = geographic_data?.find((geographic) => geographic.greaterAreaID === id);
    // console.log("Geographic view profile button has this value for geographic: ", geographic);
    // console.log("View profile page: ", JSON.stringify(clinic.data));
    if (geographic) {
      // Assuming userQuery.data contains the user object
      const userData = geographic;

      const greaterAreas = { id: userData.greaterAreaID, name: userData.greaterArea };
      // map((area) => {
      //   return { id: area.greaterArea.greaterAreaID, name: area.greaterArea.greaterArea };
      // });

      const areas = userData.area.map((area) => {
        return { id: area.areaID, name: area.area, greaterAreaID: area.greaterAreaID, selected: false };
      });

      const streets = userData.area.map((street) => {
        return street.street.map((street) => {
          return { id: street.streetID, name: street.street, areaID: street.areaID, selected: false };
        });
      });

      //flatmap the streets
      const flatStreets = streets.flat();

      setGreaterArea(greaterAreas);
      setAreaList(areas);
      setStreetList(flatStreets);
      setUpdatedAt(userData.updatedAt);
    }
    setIsCreate(false);
    setIsUpdate(false);
    setIsViewProfilePage(true);
    setIsLoading(false);
  };

  useEffect(() => {
    //console.log("View profile page: ", JSON.stringify(user.data));
    if (isViewProfilePage) {
      //void clinic.refetch();
    }
    if (geographic) {
      const userData = geographic;

      const greaterAreas = { id: userData.greaterAreaID, name: userData.greaterArea };
      // map((area) => {
      //   return { id: area.greaterArea.greaterAreaID, name: area.greaterArea.greaterArea };
      // });

      const areas = userData.area.map((area) => {
        return { id: area.areaID, name: area.area, greaterAreaID: area.greaterAreaID, selected: false };
      });

      const streets = userData.area.map((street) => {
        return street.street.map((street) => {
          return { id: street.streetID, name: street.street, areaID: street.areaID, selected: false };
        });
      });

      //flatmap the streets
      const flatStreets = streets.flat();

      setGreaterArea(greaterAreas);
      setAreaList(areas);
      setStreetList(flatStreets);
    }
    // setIsCreate(false);
    // setIsUpdate(false);
    // setIsViewProfilePage(true);
  }, [isViewProfilePage]); // Effect runs when userQuery.data changes

  //------------------------------BACK BUTTON-----------------------------------------
  const handleBackButton = () => {
    setIsCreate(false);
    setIsViewProfilePage(false);
    setIsUpdate(false);

    setGreaterArea({ id: 0, name: "" });
    setAreaList([]);
    setStreetList([]);
    setAreaOption({ id: 0, name: "", greaterAreaID: 0, selected: false });
    setStreetOption({ id: 0, name: "", areaID: 0, selected: false });

    setShowArea(false);
    setShowStreet(false);
  };

  //-------------------------------MODAL-----------------------------------------
  //CREATE BUTTON MODAL
  const [isCreateButtonModalOpen, setIsCreateButtonModalOpen] = useState(false);
  const [mandatoryFields, setMandatoryFields] = useState<string[]>([]);
  const [errorFields, setErrorFields] = useState<{ field: string; message: string }[]>([]);

  //GREATER AREA
  const handleCreateGreaterAreaButtonModal = () => {
    const mandatoryFields: string[] = [];
    const errorFields: { field: string; message: string }[] = [];

    if (greaterArea?.name === "") mandatoryFields.push("Greater Area");
    //if (areaList.length === 0) mandatoryFields.push("Area");
    //if (streetList.length === 0) mandatoryFields.push("Street");

    setMandatoryFields(mandatoryFields);
    setErrorFields(errorFields);

    if (mandatoryFields.length > 0 || errorFields.length > 0) {
      setIsCreateButtonModalOpen(true);
    } else if (isUpdate) {
      void handleUpdateGreaterArea();
    } else {
      void handleNewGreaterArea();
    }
  };

  //AREA
  const handleCreateAreasButtonModal = () => {
    const mandatoryFields: string[] = [];
    const errorFields: { field: string; message: string }[] = [];

    if (greaterArea?.name === "") mandatoryFields.push("Greater Area");
    if (areaOption?.name === "") mandatoryFields.push("Area");
    //if (streetList.length === 0) mandatoryFields.push("Street");

    setMandatoryFields(mandatoryFields);
    setErrorFields(errorFields);

    if (mandatoryFields.length > 0 || errorFields.length > 0) {
      setIsCreateButtonModalOpen(true);
    } else if (isUpdate) {
      void handleUpdateArea();
    } else {
      void handleNewArea();
    }
  };

  //STREET
  const handleCreateStreetsButtonModal = () => {
    const mandatoryFields: string[] = [];
    const errorFields: { field: string; message: string }[] = [];

    //if (!greaterArea) mandatoryFields.push("Greater Area");
    //if (areaList.length === 0) mandatoryFields.push("Area");
    if (streetOption?.name === "") mandatoryFields.push("Street");
    if (areaOption?.id === 0) mandatoryFields.push("Select one Area");

    setMandatoryFields(mandatoryFields);
    setErrorFields(errorFields);

    if (mandatoryFields.length > 0 || errorFields.length > 0) {
      setIsCreateButtonModalOpen(true);
    } else if (isUpdate) {
      void handleUpdateStreet();
    } else {
      void handleNewStreets();
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

  return (
    <>
      <Head>
        <title>Geographic</title>
      </Head>
      <main className="flex flex-col text-normal">
        <Navbar />
        {!isCreate && !isViewProfilePage && !isUpdate && (
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
                  {/* <button
                    className="absolute left-0 top-0 mx-3 mb-3 rounded-lg bg-main-orange p-3 text-white hover:bg-orange-500"
                    onClick={handleDownloadCommunicationTable}
                  >
                    {isLoading ? (
                      <div
                        className="mx-2 inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-current border-white border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
                        role="status"
                      />
                    ) : (
                      <div>Download Geographic Tables</div>
                    )}
                  </button> */}

                  {/* <button className="absolute left-0 top-0 mx-3 mb-3 rounded-lg bg-main-orange p-3 text-white hover:bg-orange-500" onClick={uploadButton}>
                    {isLoading ? (
                      <div
                        className="mx-2 inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-current border-white border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
                        role="status"
                      />
                    ) : (
                      <div>Upload Geographic Tables</div>
                    )}
                  </button> */}
                  <input
                    className="mt-3 flex w-1/3 rounded-lg border-2 border-zinc-800 px-2"
                    placeholder="Search..."
                    onChange={(e) => setQuery(getQueryFromSearchPhrase(e.target.value))}
                  />
                  <button
                    className="absolute right-0 top-0 mx-3 mb-3 rounded-lg bg-main-orange p-3 text-white hover:bg-orange-500"
                    onClick={handleCreateNewUser}
                  >
                    Create New Greater Area
                  </button>
                  {/* <button className="absolute left-0 top-0 mx-3 mb-3 rounded-lg bg-main-orange p-3 hover:bg-orange-500" onClick={handleDeleteAllUsers}>
                    Delete all users
                  </button> */}
                </div>
              </div>

              {geographic_data ? (
                <article className="my-6 flex max-h-[60%] w-full items-center justify-center overflow-auto rounded-md shadow-inner">
                  <table className="table-auto">
                    <thead>
                      <tr>
                        <th className="px-4 py-2"></th>
                        <th className=" px-4 py-2">ID</th>
                        <th className=" px-4 py-2">Greater Area</th>
                        <th className="px-4 py-2">Area</th>
                        <th className="px-4 py-2">Street</th>
                        <th className="w-[35px] px-4 py-2">
                          <span className="group relative inline-block">
                            <button className={`${order === "updatedAt" ? "underline" : ""}`} onClick={() => handleOrderFields("updatedAt")}>
                              Date
                            </button>
                            <span className="absolute right-[-20px] top-full hidden w-[110px] rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 shadow-sm group-hover:block">
                              Sort reverse chronologically
                            </span>
                          </span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {geographic_data?.map((geo, index) => {
                        return (
                          <tr className=" items-center">
                            <td className=" border px-4 py-2">
                              <div className="px-4 py-2">{index + 1}</div>
                            </td>
                            <td className="border px-4 py-2">G{geo.greaterAreaID}</td>
                            <td className="max-w-[15rem] border px-4 py-2">{geo.greaterArea}</td>
                            <td className="max-w-[15rem] border px-4 py-2">
                              {geo.area.length > 10
                                ? geo.area
                                    .slice(0, 10)
                                    .map((area) => area.area)
                                    .join("; ") + "..."
                                : geo.area.map((area) => area.area).join("; ")}
                            </td>
                            <td className="max-w-[15rem] border px-4 py-2">
                              {/* {geo.area.map((street) => {
                                return street.street.map((street) => street.street).join("; ");
                              })} */}
                              {/* Flatten the streets to one string array */}
                              {geo.area.length > 10
                                ? geo.area
                                    .map((street) => {
                                      return street.street.slice(0, 1).map((street) => street.street);
                                    })
                                    .flat()
                                    .join("; ") + "..."
                                : geo.area
                                    .map((street) => {
                                      return street.street.slice(0, 2).map((street) => street.street);
                                    })
                                    .flat()
                                    .join("; ")}
                            </td>
                            <td className=" border px-4 py-2">
                              {geo?.updatedAt?.getDate()?.toString() ?? ""}
                              {"/"}
                              {((geo?.updatedAt?.getMonth() ?? 0) + 1)?.toString() ?? ""}
                              {"/"}
                              {geo?.updatedAt?.getFullYear()?.toString() ?? ""}
                            </td>
                            <div className="flex">
                              {/* <div className="relative flex items-center justify-center">
                                <span className="group relative mx-2 my-3 flex items-center justify-center rounded-lg hover:bg-orange-200">
                                  <Trash
                                    size={24}
                                    className="block"
                                    onClick={() => handleDeleteModal(geo.greaterAreaID, `G${geo.greaterAreaID}`, geo.greaterArea)}
                                  />
                                  <span className="absolute bottom-full hidden w-[100px] rounded-md border border-gray-300 bg-white px-2 py-1 text-center text-sm text-gray-700 shadow-sm group-hover:block">
                                    Delete greater area
                                  </span>
                                </span>
                              </div> */}

                              <div className="relative flex items-center justify-center">
                                <span className="group relative mx-2 my-3 flex items-center justify-center rounded-lg hover:bg-orange-200">
                                  <Pencil size={24} className="block" onClick={() => handleUpdatePage(geo.greaterAreaID)} />
                                  <span className="absolute bottom-full hidden w-[100px] rounded-md border border-gray-300 bg-white px-2 py-1 text-center text-sm text-gray-700 shadow-sm group-hover:block">
                                    Update greater area
                                  </span>
                                </span>
                              </div>

                              <div className="relative flex items-center justify-center">
                                <span className="group relative mx-2 my-3 flex items-center justify-center rounded-lg hover:bg-orange-200">
                                  <AddressBook size={24} className="block" onClick={() => handleViewProfilePage(geo.greaterAreaID, geo.greaterArea)} />
                                  <span className="absolute bottom-full hidden w-[100px] rounded-md border border-gray-300 bg-white px-2 py-1 text-center text-sm text-gray-700 shadow-sm group-hover:block">
                                    View greater area profile
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
              ) : (
                <div className="flex items-center justify-center pt-10">
                  <div
                    className="mx-2 inline-block h-24 w-24 animate-spin rounded-full border-8 border-solid border-current border-main-orange border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
                    role="status"
                  />
                </div>
                // <div className="flex h-96 items-center justify-center">
                //   <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-t-2 border-main-orange" />
                // </div>
              )}
            </div>
          </>
        )}

        {/*CREATE AND UPDATE USER*/}
        {(isCreate || isUpdate) && (
          <>
            <div className="flex justify-center">
              <div className="relative mb-4 flex grow flex-col items-center rounded-lg bg-slate-200 px-5 py-6">
                <b className=" text-2xl">{"Create New Greater Area"}</b>
                <div className="flex justify-center">
                  <button className="absolute right-0 top-0 m-3 rounded-lg bg-main-orange p-3 text-white hover:bg-orange-500" onClick={handleBackButton}>
                    Back To Greater Area Table
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
              <div className="flex w-[46%] flex-col">
                {/*<div className="p-2">User ID: {(lastUserCreated?.data?.userID ?? 1000000) + 1}</div>*/}
                <div className="relative my-2 flex w-full flex-col rounded-lg border-2 bg-slate-200 p-4">
                  <b className="mb-3 text-center text-xl">Geographic Data</b>

                  <div className="flex py-2">
                    Greater area ID: <div className="px-3">G{1000001}</div>
                  </div>

                  <div className="flex items-start">
                    <label>
                      Greater area{<span className="text-lg text-main-orange">*</span>}:{" "}
                      <input
                        className="m-2 rounded-lg border-2 border-slate-300 px-2 focus:border-black"
                        onChange={(e) => handleGreaterArea(e.target.value)}
                        value={greaterArea?.name}
                      />
                    </label>
                    <button
                      className="my-1 rounded-md bg-main-orange px-2 py-1 text-white hover:bg-orange-500"
                      onClick={() => void handleCreateGreaterAreaButtonModal()}
                    >
                      {isLoadingGreaterArea ? (
                        <div
                          className="mx-2 inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-current border-white border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
                          role="status"
                        />
                      ) : (
                        <div>Add Greater Area</div>
                      )}
                    </button>
                  </div>

                  {/* Area */}
                  {greaterArea?.id !== 0 && (
                    <div className="flex items-start">
                      <div className="mr-3 mt-2 flex items-center pt-4">
                        <div className="flex">
                          Area<div className="text-lg text-main-orange">*</div>:{" "}
                        </div>
                      </div>

                      <div className="flex flex-col items-center">
                        <button
                          onClick={handleShowArea}
                          className="mb-2 mr-3 mt-5 inline-flex items-center rounded-lg bg-main-orange px-4 py-2 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                        >
                          Show all areas
                        </button>
                        {showArea && (
                          <ul className="mr-3 w-full rounded-lg bg-white px-5 py-2 text-sm text-gray-700 dark:text-gray-200">
                            {areaList.map((area) => (
                              <li key={area.id} className=" py-2">
                                <label>
                                  <input type="radio" name="area" value={areaOption?.name} onChange={() => handleSelectedArea(area.id)} />
                                  {area.name}
                                </label>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <div className="flex items-center">
                        <input
                          className="m-2 mt-5 rounded-lg border-2 border-slate-300 px-2 focus:border-black"
                          onChange={(e) => handleAreaInput(e.target.value)}
                          value={areaOption?.name}
                        />
                        <button className="m-2 mt-5 rounded-lg bg-main-orange px-2 py-1 text-white hover:bg-orange-500" onClick={handleCreateAreasButtonModal}>
                          {isLoadingArea ? (
                            <div
                              className="mx-2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-solid border-current border-white border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
                              role="status"
                            />
                          ) : (
                            <div>Add Area to Greater Area</div>
                          )}
                        </button>
                      </div>
                      {/* <button
                      className="my-1 rounded-md bg-main-orange px-2 py-1 text-lg text-white hover:bg-orange-500"
                      onClick={() => void handleCreateAreasButtonModal()}
                    >
                      {isLoadingArea ? (
                        <div
                          className="mx-2 inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-current border-white border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
                          role="status"
                        />
                      ) : (
                        <div>Create Areas</div>
                      )}
                    </button> */}
                    </div>
                  )}

                  {/* Street */}
                  {areaOption?.id !== 0 && (
                    <div className="flex items-center">
                      <div className="mr-3 flex items-center pt-4">
                        <div className="flex">
                          Street<div className="text-lg text-main-orange">*</div>:{" "}
                        </div>
                      </div>

                      <div className="flex flex-col items-center">
                        <button
                          onClick={handleShowStreet}
                          className="mb-2 mr-3 mt-3 inline-flex items-center rounded-lg bg-main-orange px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                        >
                          Show all streets
                        </button>
                        {showStreet && (
                          <ul className="mr-3 w-full rounded-lg bg-white px-5 py-2 text-sm text-gray-700 dark:text-gray-200">
                            {selectedStreetList.map((street) => (
                              <li key={street.id} className=" py-2">
                                <label>
                                  <input type="radio" name="area" value={street.name} onChange={() => handleSelectedStreet(street.id)} />
                                  {street.name}
                                </label>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <div className="flex items-center">
                        <input
                          className="m-2 rounded-lg border-2 border-slate-300 px-2 focus:border-black"
                          onChange={(e) => handleStreetInput(e.target.value)}
                          value={streetOption?.name}
                        />
                        <button className="m-2 rounded-lg bg-main-orange px-2 py-1 text-white hover:bg-orange-500" onClick={handleCreateStreetsButtonModal}>
                          {isLoadingStreet ? (
                            <div
                              className="mx-2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-solid border-current border-white border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
                              role="status"
                            />
                          ) : (
                            <div>Add Street to Area</div>
                          )}
                        </button>
                      </div>

                      {/* <button
                      className="my-1 rounded-md bg-main-orange px-2 py-1 text-lg text-white hover:bg-orange-500"
                      onClick={() => void handleCreateStreetsButtonModal()}
                    >
                      {isLoadingStreet ? (
                        <div
                          className="mx-2 inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-current border-white border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
                          role="status"
                        />
                      ) : (
                        <div>Create Streets</div>
                      )}
                    </button> */}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* <button
                className="my-4 rounded-md bg-main-orange px-8 py-3 text-lg text-white hover:bg-orange-500"
                onClick={() => void handleCreateButtonModal()}
              >
                {isLoading ? (
                  <div
                    className="mx-2 inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-current border-white border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
                    role="status"
                  />
                ) : (
                  <div>Create Greater Area</div>
                )}
              </button> */}
            {/* </div>
            </div> */}
          </>
        )}

        {/*VIEW PROFILE PAGE*/}
        {isViewProfilePage && (
          <>
            <div className="flex justify-center">
              <div className="relative mb-4 flex grow flex-col items-center rounded-lg bg-slate-200 px-5 py-6">
                <div className=" text-2xl">Greater Area Profile</div>
                <div className="flex justify-center">
                  <button className="absolute right-0 top-0 m-3 rounded-lg bg-main-orange p-3 text-white hover:bg-orange-500" onClick={handleBackButton}>
                    Back To Greater Area table
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

                  <b className="mb-14 text-center text-xl">Greater Area Data</b>
                  <div className="mb-2 flex items-center">
                    <b className="mr-3">Greater Area ID:</b> G{greaterArea?.id}
                  </div>

                  <div className="mb-2 flex items-center">
                    <b className="mr-3">Greater Area:</b> {greaterArea?.name}
                  </div>

                  <div className="mb-2 flex items-center">
                    <b className="mr-3">Area:</b> {areaList.map((area) => area.name).join("; ")}
                  </div>

                  <div className="mb-2 flex items-center">
                    <b className="mr-3">Street:</b> {streetList.map((street) => street.name).join("; ")}
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

export default Geographic;
