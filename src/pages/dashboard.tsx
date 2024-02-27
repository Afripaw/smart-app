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

  //const { isLoading, component: PieGraphComponent } = PieGraph({ type: "Treatments" });

  return (
    <>
      <Head>
        <title>Dashboard</title>
      </Head>
      <main className="flex h-screen flex-col">
        <Navbar />
        <div className="grid h-full grid-cols-3 grid-rows-3">
          <div className="flex flex-col items-center justify-center border border-gray-300 pr-16">
            <LineGraph type="activeOwners" />
            <div className="pl-16">Total Numbers of Active Pet Owners (Last 5 Years)</div>
          </div>
          <div className="flex flex-col items-center justify-center border border-gray-300 pr-16">
            <BarGraph type="activePets" />
            <div className="pl-16">Total Numbers of Active Pets (All Areas, Last 5 Years)</div>
          </div>
          <div className="flex flex-col items-center justify-center border border-gray-300 pr-16">
            <LineGraph type="activeVolunteers" />
            <div className="pl-16">Total Numbers of Active Volunteers (Last 5 Years)</div>
          </div>
          <div className="flex flex-col items-center justify-center border border-gray-300 pr-16">
            <LineGraph type="kennels" />
            <div className="pl-16">Total Numbers of Kennels Provided (Last 5 Years)</div>
          </div>

          <div className="flex flex-col items-center justify-center border border-gray-300 pr-16">
            <BarGraph type="sterilisedPets" />
            <div className="pl-16">Total Numbers of Sterilised Pets (All Areas, Last 5 Years)</div>
          </div>
          <div className="flex flex-col items-center justify-center border border-gray-300 pr-16">
            <LineGraph type="clinics" />
            <div className="pl-16">Total Numbers of Pet Clinics Held (Last 5 Years)</div>
          </div>
          <div className="flex flex-col items-center justify-center border border-gray-300">
            <PieGraph type="ClinicVisits" />
            <div className="">Total Clinic Visits to Date</div>
          </div>
          <div className="flex flex-col items-center justify-center border border-gray-300">
            <div className="flex w-2/3 justify-around pb-2 pt-4">
              <div className=" flex w-[104px] flex-col items-center justify-center rounded-lg bg-main-orange p-2 text-white">
                {!clinicVisits.data ? (
                  <div
                    className="mx-2 inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-current border-white border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
                    role="status"
                  />
                ) : (
                  <>
                    <div className="text-lg">{clinicVisits?.data ?? 0}</div>
                  </>
                )}
                <div className="text-xs">Pet Clinic visits</div>
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
                <div className="text-xs">Pets Sterilised</div>
              </div>
            </div>
            <div className="flex w-2/3 justify-around py-2">
              <div className=" flex flex-col items-center justify-center rounded-lg bg-main-orange p-2 text-white">
                {!kennels.data ? (
                  <div
                    className="mx-2 inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-current border-white border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
                    role="status"
                  />
                ) : (
                  <>
                    <div className="text-lg">{kennels?.data ?? 0}</div>
                  </>
                )}
                <div className="text-xs">Kennels Provided</div>
              </div>
              <div className=" flex flex-col items-center justify-center rounded-lg bg-main-orange p-2 text-white">
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
                <div className="text-xs">Active Volunteers</div>
              </div>
            </div>
            <div className=" flex w-full grow justify-center py-2">
              <div>Important Statistics (All Areas, Totals to Date)</div>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center border border-gray-300">
            <PieGraph type="Treatments" />
            <div className="">Treatments Administered to Date</div>
            {/* {PieGraphComponent}
            {!isLoading && <div className="">Treatments Administered</div>} */}
          </div>
        </div>
      </main>
    </>
  );
};

export default Dashboard;
