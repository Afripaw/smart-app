import { type NextPage } from "next";
import Head from "next/head";
//import { useState } from "react";
//import { api } from "~/utils/api";
import Navbar from "../components/navbar";

const Info: NextPage = () => {
  return (
    <>
      <Head>
        <title>Information and Retrieval</title>
      </Head>
      <main className="flex h-screen flex-col text-normal">
        <Navbar />

        <div className="grid-rows-7 grid h-full w-full grow">
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

          {/* Make a generic table */}
          <div className="row-span-3 flex w-full grow justify-center bg-slate-300">TABLE</div>
        </div>
      </main>
    </>
  );
};

export default Info;
