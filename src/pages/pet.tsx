import { type NextPage } from "next";
import Head from "next/head";
//import { useState } from "react";
//import { api } from "~/utils/api";
import Navbar from "../components/navbar";

const Pet: NextPage = () => {
  return (
    <>
      <Head>
        <title>Pet Profiles</title>
      </Head>
      <main className="">
        <Navbar />
      </main>
    </>
  );
};

export default Pet;
