import { type NextPage } from "next";
import Head from "next/head";
import { useState } from "react";
import { api } from "~/utils/api";
import { useRouter } from "next/router";
import Navbar from "../components/navbar";

const Owner: NextPage = () => {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>Owner Profiles</title>
      </Head>
      <main className="">
        <Navbar />
      </main>
    </>
  );
};

export default Owner;
