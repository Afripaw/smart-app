import { type NextPage } from "next";
import Head from "next/head";
//import { useState } from "react";
//import { api } from "~/utils/api";
import Navbar from "../components/navbar";

const Geographic: NextPage = () => {
  return (
    <>
      <Head>
        <title>Geographic</title>
      </Head>
      <main className="text-normal flex flex-col">
        <Navbar />
      </main>
    </>
  );
};

export default Geographic;
