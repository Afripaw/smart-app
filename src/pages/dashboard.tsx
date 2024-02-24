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
          <div className="flex items-center justify-center border border-gray-300 pr-16">
            <LineGraph type="activeOwners" />
          </div>
          <div className="flex flex-col items-center justify-center border border-gray-300 pr-16">
            <BarGraph type="activePets" />
            <div className="pl-16">Active Pets</div>
          </div>
          <div className="flex items-center justify-center border border-gray-300 pr-16">
            <LineGraph type="activeVolunteers" />
          </div>
          <div className="flex items-center justify-center border border-gray-300 pr-16">
            <LineGraph type="kennels" />
          </div>

          <div className="flex flex-col items-center justify-center border border-gray-300 pr-16">
            <BarGraph type="sterilisedPets" />
            <div className="pl-16">Sterilised Pets</div>
          </div>
          <div className="flex items-center justify-center border border-gray-300 pr-16">
            <LineGraph type="clinics" />
          </div>
          <div className="flex flex-col items-center justify-center border border-gray-300">
            <PieGraph type="ClinicVisits" />
            <div className="">Clinic Visits</div>
          </div>
          <div className="relative border border-gray-300">
            <div className="absolute left-32 top-2 flex aspect-square flex-col items-center justify-center rounded-full bg-main-orange p-2 text-white">
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
            <div className="absolute right-32 top-2 flex aspect-square flex-col items-center justify-center rounded-full bg-main-orange p-3 text-white">
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
            <div className="absolute bottom-2 left-32 flex aspect-square flex-col items-center justify-center rounded-full bg-main-orange p-1 text-white">
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
            <div className="absolute bottom-2 right-32 flex aspect-square flex-col items-center justify-center rounded-full bg-main-orange p-1 text-white">
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
          <div className="flex flex-col items-center justify-center border border-gray-300">
            <PieGraph type="Treatments" />
            <div className="">Treatments Administered</div>
            {/* {PieGraphComponent}
            {!isLoading && <div className="">Treatments Administered</div>} */}
          </div>
        </div>
      </main>
    </>
  );
};

export default Dashboard;
