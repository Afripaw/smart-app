import { type NextPage } from "next";
import Head from "next/head";
//import { useState } from "react";
//import { api } from "~/utils/api";
import Navbar from "../components/navbar";
import LineGraph from "~/components/Charts/lineGraph";

const Dashboard: NextPage = () => {
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
          <div className="border border-gray-300">Block 2</div>
          <div className="flex items-center justify-center border border-gray-300 pr-16">
            <LineGraph type="activeVolunteers" />
          </div>
          <div className="border border-gray-300">Block 4</div>

          <div className="flex items-center justify-center border border-gray-300"></div>
          <div className="border border-gray-300">Block 6</div>
          <div className="border border-gray-300">Block 7</div>
          <div className="border border-gray-300">Block 8</div>
          <div className="border border-gray-300">Block 9</div>
        </div>
      </main>
    </>
  );
};

export default Dashboard;
