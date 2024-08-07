import { type NextPage } from "next";
import Head from "next/head";
//import { useState } from "react";
//import { api } from "~/utils/api";
import Navbar from "../components/navbar";
import LineGraph from "~/components/Charts/lineGraph";
import PieGraph from "~/components/Charts/pieGraph";
import BarGraph from "~/components/Charts/barGraph";
import { api } from "~/utils/api";
import { useSession } from "next-auth/react";

const Dashboard: NextPage = () => {
  useSession({ required: true });
  const activeVolunteers = api.welcomePage.getVolunteers.useQuery();
  const sterilisedPets = api.welcomePage.getSterilisedPets.useQuery();
  const clinicVisits = api.welcomePage.getAllClinicVisits.useQuery();
  const kennels = api.welcomePage.getAllKennels.useQuery();
  const vaccinatedPets = api.welcomePage.getPetsVaccinated.useQuery();
  const treatments = api.welcomePage.getAllTreatments.useQuery();

  //const { isLoading, component: PieGraphComponent } = PieGraph({ type: "Treatments" });

  return (
    <>
      <Head>
        <title>Dashboard</title>
      </Head>
      <main className="flex h-screen text-normal xs:flex-row sm:flex-col md:text-xs xl:text-normal ">
        <Navbar />
        <div className="grid h-full xs:grid-cols-1 xs:grid-rows-4 xs:overflow-hidden sm:grid-cols-3 sm:grid-rows-3">
          <div className="flex flex-col items-center justify-center border border-gray-300 pr-16 xs:row-span-1">
            <LineGraph type="activeOwners" />
            <div className="md:pl-9 xl:pl-12">
              <div className="">New Pet Owners per Greater Area (Last 5 Years)</div>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center border border-gray-300 pr-16 xs:row-span-1">
            <BarGraph type="clinicsVisited" />
            <div className="pl-12">Clinic Visits by Pets (All Areas, Last 5 Years)</div>
          </div>
          <div className="flex flex-col items-center justify-center border border-gray-300 pr-16 xs:row-span-1">
            <LineGraph type="activeVolunteers" />
            <div className="md:pl-9 xl:pl-12">New Volunteers per Greater Area (Last 5 Years)</div>
          </div>
          <div className="flex flex-col items-center justify-center border border-gray-300 pr-16 xs:row-span-1">
            <LineGraph type="kennels" />
            <div className="md:pl-9 xl:pl-12">Kennels Provided per Greater Area (Last 5 Years)</div>
          </div>

          <div className=" flex flex-col items-center justify-center border border-gray-300 pr-16">
            <BarGraph type="sterilisedPets" />
            <div className="pl-12">Pets Sterilised (All Areas, Last 5 Years)</div>
          </div>
          <div className=" flex flex-col items-center justify-center border border-gray-300 pr-16">
            <LineGraph type="clinics" />
            <div className="md:pl-9 xl:pl-12">Pet Clinics Held per Greater Area (Last 5 Years)</div>
          </div>
          <div className=" flex flex-col items-center justify-center border border-gray-300">
            <PieGraph type="ClinicVisits" />
            <div className="pb-2">Total Clinic Visits to Date</div>
          </div>
          <div className="flex flex-col items-center justify-center border border-gray-300">
            <div className="flex w-full flex-col items-center justify-around">
              <div className="flex w-2/3 justify-around gap-1 pt-4 xl:pb-2">
                <div className=" flex w-[104px] flex-col items-center justify-center rounded-lg bg-main-orange p-2 text-white">
                  {!clinicVisits.data && clinicVisits.data != 0 ? (
                    <div
                      className="mx-2 inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-current border-white border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
                      role="status"
                    />
                  ) : (
                    <>
                      <div className="text-lg">{clinicVisits?.data ?? 0}</div>
                    </>
                  )}
                  <div className="text-center text-xs">Pet Clinic visits</div>
                </div>
                <div className=" flex w-[104px] flex-col items-center justify-center rounded-lg bg-main-orange p-2 text-white">
                  {!vaccinatedPets.data && vaccinatedPets.data != 0 ? (
                    <div
                      className="mx-2 inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-current border-white border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
                      role="status"
                    />
                  ) : (
                    <>
                      <div className="text-lg">{vaccinatedPets?.data ?? 0}</div>
                    </>
                  )}
                  <div className="text-center text-xs">Pets Vaccinated</div>
                </div>
                <div className=" flex w-[104px] flex-col items-center justify-center rounded-lg bg-main-orange p-2 text-white">
                  {!sterilisedPets?.data ? (
                    <div
                      className="mx-2 inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-current border-white border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
                      role="status"
                    />
                  ) : (
                    <>
                      <div className="text-lg">{sterilisedPets?.data?.length ?? 0}</div>
                    </>
                  )}
                  <div className="text-center text-xs">Pets Sterilised</div>
                </div>
              </div>
              <div className="flex w-2/3 justify-around gap-1 pt-2 xl:pb-2">
                <div className=" flex w-[104px] flex-col items-center justify-center rounded-lg bg-main-orange p-2 text-white">
                  {!kennels.data && kennels.data != 0 ? (
                    <div
                      className="mx-2 inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-current border-white border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
                      role="status"
                    />
                  ) : (
                    <>
                      <div className="text-lg">{kennels?.data ?? 0}</div>
                    </>
                  )}
                  <div className="text-center text-xs">Kennels Provided</div>
                </div>

                <div className=" flex w-[104px] flex-col items-center justify-center rounded-lg bg-main-orange p-2 text-white">
                  {!treatments.data && treatments.data != 0 ? (
                    <div
                      className="mx-2 inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-current border-white border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
                      role="status"
                    />
                  ) : (
                    <>
                      <div className="text-lg">{treatments?.data ?? 0}</div>
                    </>
                  )}
                  <div className="text-center  text-xs">Pet Treatments</div>
                </div>

                <div className=" flex w-[104px] flex-col items-center justify-center rounded-lg bg-main-orange p-2 text-white">
                  {!activeVolunteers?.data ? (
                    <div
                      className="mx-2 inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-current border-white border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
                      role="status"
                    />
                  ) : (
                    <>
                      <div className="text-lg">{activeVolunteers?.data?.length ?? 0}</div>
                    </>
                  )}
                  <div className="text-center text-xs">Active Volunteers</div>
                </div>
              </div>
              <div className=" flex w-full grow justify-center md:pb-2 xl:py-2">
                <div>Important Statistics (All Areas, Totals to Date)</div>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center border border-gray-300">
            <PieGraph type="Treatments" />
            <div className="pb-2">Treatments Administered to Date</div>
            {/* {PieGraphComponent}
            {!isLoading && <div className="">Treatments Administered</div>} */}
          </div>
        </div>
      </main>
    </>
  );
};

export default Dashboard;
