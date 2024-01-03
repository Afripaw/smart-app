import { type NextPage } from "next";
import Head from "next/head";
import { useState } from "react";
import { api } from "~/utils/api";
import Navbar from "../components/navbar";

const Dashboard: NextPage = () => {
  return (
    <>
      <Head>
        <title>Dashboard</title>
      </Head>
      <main className="flex flex-col">
        <Navbar />
        <div className="grid h-screen grid-cols-3 grid-rows-3">
          <div className="border border-gray-300">Block 1</div>
          <div className="border border-gray-300">Block 2</div>
          <div className="border border-gray-300">Block 3</div>
          <div className="border border-gray-300">Block 4</div>
          <div className="flex items-center justify-center border border-gray-300 text-center text-2xl">KPI's</div>
          <div className="border border-gray-300">Block 6</div>
          <div className="border border-gray-300">Block 7</div>
          <div className="border border-gray-300">Block 8</div>
          <div className="border border-gray-300">Block 9</div>
        </div>

        {/*<div className="grid grid-cols-3">
          <div className="col-span-1 grid grid-rows-3 bg-blue-600 text-black">
            <div className="row-span-1 text-center text-black">
              <div className="flex grow flex-col">1</div>
            </div>
            <div className="row-span-1 text-center text-black">
              <div className="flex grow flex-col">2</div>
            </div>
            <div className="row-span-1 text-center text-black">
              <div className="flex grow flex-col">3</div>
            </div>
          </div>
          <div className="col-span-1 grid grid-rows-3 bg-red-600 text-black">
            <div className="row-span-1 text-center text-black">
              <div className="flex grow flex-col">4</div>
            </div>
            <div className="row-span-1 text-center text-black">
              <div className="flex grow flex-col">5</div>
            </div>
            <div className="row-span-1 text-center text-black">
              <div className="flex grow flex-col">6</div>
            </div>
          </div>
          <div className="col-span-1 grid grid-rows-3 bg-green-600 text-black">
            <div className="row-span-1 text-center text-black">
              <div className="flex grow flex-col">7</div>
            </div>
            <div className="row-span-1 text-center text-black">
              <div className="flex grow flex-col">8</div>
            </div>
            <div className="row-span-1 text-center text-black">
              <div className="flex grow flex-col">9</div>
            </div>
          </div>
  </div>*/}
      </main>
    </>
  );
};

export default Dashboard;
