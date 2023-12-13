import { signIn, signOut, useSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";

import { api } from "~/utils/api";
import { useRouter } from "next/router";
import { SetStateAction, useState, useEffect, useRef, use } from "react";
import { sign } from "crypto";

export default function Home() {
  //const hello = api.post.hello.useQuery({ text: "from tRPC" });

  const { data: session } = useSession();
  const newUser = api.user.create.useMutation();
  const newPet = api.pet.create.useMutation();
  const [signUp, setSignUp] = useState(false);
  const [signIn, setSignIn] = useState(false);

  //--------------------------------DROPDOWN BOXES--------------------------------
  const [isGreaterAreaOpen, setIsGreaterAreaOpen] = useState(false);
  const [greaterAreaOption, setGreaterAreaOption] = useState("Greater Area");
  const greaterAreaRef = useRef<HTMLDivElement>(null);
  const btnGreaterAreaRef = useRef<HTMLButtonElement>(null);

  const [preferredCommunication, setPreferredCommunication] = useState(false);
  const [preferredOption, setPreferredCommunicationOption] = useState(
    "Preferred Communication",
  );
  const preferredCommunicationRef = useRef<HTMLDivElement>(null);
  const btnPreferredCommunicationRef = useRef<HTMLButtonElement>(null);

  const [role, setRole] = useState(false);
  const [roleOption, setRoleOption] = useState("Role");
  const roleRef = useRef<HTMLDivElement>(null);
  const btnRoleRef = useRef<HTMLButtonElement>(null);

  const [status, setStatus] = useState(false);
  const [statusOption, setStatusOption] = useState("Status");
  const statusRef = useRef<HTMLDivElement>(null);
  const btnStatusRef = useRef<HTMLButtonElement>(null);

  //GREATER AREA
  const handleToggleGreaterArea = () => {
    setIsGreaterAreaOpen(!isGreaterAreaOpen);
  };

  const handleGreaterAreaOption = (option: SetStateAction<string>) => {
    setGreaterAreaOption(option);
    setIsGreaterAreaOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        greaterAreaRef.current &&
        !greaterAreaRef.current.contains(event.target as Node) &&
        btnGreaterAreaRef.current &&
        !btnGreaterAreaRef.current.contains(event.target as Node)
      ) {
        setIsGreaterAreaOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  //PREFERRED COMMUNICATION
  const handleTogglePreferredCommunication = () => {
    setPreferredCommunication(!preferredCommunication);
  };

  const handlePreferredCommunicationOption = (
    option: SetStateAction<string>,
  ) => {
    setPreferredCommunicationOption(option);
    setPreferredCommunication(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        preferredCommunicationRef.current &&
        !preferredCommunicationRef.current.contains(event.target as Node) &&
        btnPreferredCommunicationRef.current &&
        !btnPreferredCommunicationRef.current.contains(event.target as Node)
      ) {
        setPreferredCommunication(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  //ROLE
  const handleToggleRole = () => {
    setRole(!role);
  };

  const handleRoleOption = (option: SetStateAction<string>) => {
    setRoleOption(option);
    setRole(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        roleRef.current &&
        !roleRef.current.contains(event.target as Node) &&
        btnRoleRef.current &&
        !btnRoleRef.current.contains(event.target as Node)
      ) {
        setRole(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  //STATUS
  const handleToggleStatus = () => {
    setStatus(!status);
  };

  const handleStatusOption = (option: SetStateAction<string>) => {
    setStatusOption(option);
    setStatus(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        statusRef.current &&
        !statusRef.current.contains(event.target as Node) &&
        btnStatusRef.current &&
        !btnStatusRef.current.contains(event.target as Node)
      ) {
        setStatus(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  //handle sign up
  const handleSignUp = async () => {
    signUp ? setSignUp(false) : setSignUp(true);
  };

  //handle sign in
  const handleSignIn = async () => {
    signIn ? setSignIn(false) : setSignIn(true);
  };

  const handleNewUser = async () => {
    await newUser.mutateAsync({
      firstName: "John",
      email: "Email",
      surname: "King",
      mobile: "0574723975",
      addressGreaterArea: "Johannesburg",
      addressStreet: "Main",
      addressStreetCode: "1234",
      addressStreetNumber: "1234",
      addressSuburb: "Soweto",
      addressPostalCode: "1234",
      preferredCommunication: "Email",
      role: "Admin",
      status: "Active",
      comments: "Hard working",
    });
  };

  const handleNewPet = async () => {
    await newPet.mutateAsync({
      petName: "Dixie",
      species: "Dog",
      sex: "Male",
      age: "6",
      breed: "Golden Retriever",
      colour: "Blue",
      markings: "Big green circle on the face",
      status: "Active",
      sterilisedStatus: "Yes",
      sterilisedRequested: "Yes",
      sterilisedRequestSigned: "Yes",
      vaccinatedStatus: "Yes",
      treatments: "Tender Love and Care",
      clinicsAttended: ["Vet Clinic", "Soweto Vet"],
      lastDeWorming: "2021-08-01",
      membership: "Golden",
      cardStatus: "True",
      kennelReceived: "Yes",
      comments: "Very happy dog",
    });
  };

  return (
    <>
      <Head>
        <title>Afripaw Smart App</title>
        <meta name="description" content="Smart App" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className=" flex min-h-screen flex-col bg-gray-100">
        {!signIn && !signUp && (
          <div className="flex grow flex-col items-center justify-center">
            <div className="text-3xl">Welcome to the Afripaw Smart App</div>
            <div className="flex items-center justify-center">
              <button
                className=" m-2 rounded-lg border-zinc-800 bg-orange-500 p-2 text-2xl duration-150 hover:bg-orange-600"
                onClick={() => void handleSignUp()}
              >
                Sign up
              </button>
              <button
                className=" m-2 rounded-lg border-zinc-800 bg-orange-500 p-2 text-2xl duration-150 hover:bg-orange-600"
                onClick={() => void handleSignIn()}
              >
                Sign in
              </button>
            </div>
          </div>
        )}
        {!signIn && signUp && (
          <>
            <div className="mb-4 flex flex-col items-center justify-center">
              <div className="mb-3 mt-3 text-4xl">Create Account</div>
              <div className="text-lg">Enter the following fields</div>
            </div>
            <div className="flex grow flex-col items-center">
              <input
                className="m-2 rounded-lg border-zinc-800 px-2 "
                placeholder="First Name"
              />
              <input
                className="m-2 rounded-lg border-zinc-800 px-2"
                placeholder="Surname"
              />
              <input
                className="m-2 rounded-lg border-zinc-800 px-2"
                placeholder="Email"
              />
              <input
                className="m-2 rounded-lg border-zinc-800 px-2"
                placeholder="Mobile"
              />

              <div className="flex flex-col">
                <button
                  ref={btnGreaterAreaRef}
                  className="my-3 inline-flex items-center rounded-lg bg-orange-700 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-800 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                  type="button"
                  onClick={handleToggleGreaterArea}
                >
                  {greaterAreaOption + " "}
                  <svg
                    className="ms-3 h-2.5 w-2.5"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 10 6"
                  >
                    <path
                      stroke="currentColor"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="m1 1 4 4 4-4"
                    />
                  </svg>
                </button>
                {isGreaterAreaOpen && (
                  <div
                    ref={greaterAreaRef}
                    className="z-10 w-44 divide-y divide-gray-100 rounded-lg bg-white shadow dark:bg-gray-700"
                  >
                    <ul
                      className="py-2 text-sm text-gray-700 dark:text-gray-200"
                      aria-labelledby="dropdownHoverButton"
                    >
                      <li
                        onClick={() =>
                          handleGreaterAreaOption("Not applicable")
                        }
                      >
                        <a
                          href="#"
                          className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                        >
                          Not applicable
                        </a>
                      </li>
                      <li onClick={() => handleGreaterAreaOption("Flagship")}>
                        <a
                          href="#"
                          className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                        >
                          Flagship
                        </a>
                      </li>
                      <li
                        onClick={() =>
                          handleGreaterAreaOption("Replication area 1")
                        }
                      >
                        <a
                          href="#"
                          className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                        >
                          Replication area 1
                        </a>
                      </li>
                      <li
                        onClick={() =>
                          handleGreaterAreaOption("Replication area 2")
                        }
                      >
                        <a
                          href="#"
                          className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                        >
                          Replication area 2
                        </a>
                      </li>
                    </ul>
                  </div>
                )}
              </div>

              <input
                className="m-2 rounded-lg border-zinc-800 px-2 "
                placeholder="Address Street"
              />
              <input
                className="m-2 rounded-lg border-zinc-800 px-2 "
                placeholder="Address Street Code"
              />
              <input
                className="m-2 rounded-lg border-zinc-800 px-2"
                placeholder="Address Street Number"
              />
              <input
                className="m-2 rounded-lg border-zinc-800 px-2"
                placeholder="Address Suburb"
              />
              <input
                className="m-2 rounded-lg border-zinc-800 px-2"
                placeholder="Address Postal Code"
              />

              <div className="flex flex-col">
                <button
                  ref={btnPreferredCommunicationRef}
                  className="my-3 inline-flex items-center rounded-lg bg-orange-700 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-800 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                  type="button"
                  onClick={handleTogglePreferredCommunication}
                >
                  {preferredOption + " "}
                  <svg
                    className="ms-3 h-2.5 w-2.5"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 10 6"
                  >
                    <path
                      stroke="currentColor"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="m1 1 4 4 4-4"
                    />
                  </svg>
                </button>
                {preferredCommunication && (
                  <div
                    ref={preferredCommunicationRef}
                    className="z-10 w-44 divide-y divide-gray-100 rounded-lg bg-white shadow dark:bg-gray-700"
                  >
                    <ul
                      className="py-2 text-sm text-gray-700 dark:text-gray-200"
                      aria-labelledby="dropdownHoverButton"
                    >
                      <li
                        onClick={() =>
                          handlePreferredCommunicationOption("Email")
                        }
                      >
                        <a
                          href="#"
                          className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                        >
                          Email
                        </a>
                      </li>
                      <li
                        onClick={() =>
                          handlePreferredCommunicationOption("SMS")
                        }
                      >
                        <a
                          href="#"
                          className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                        >
                          SMS
                        </a>
                      </li>
                      <li
                        onClick={() =>
                          handlePreferredCommunicationOption("Whatsapp")
                        }
                      >
                        <a
                          href="#"
                          className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                        >
                          Whatsapp
                        </a>
                      </li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex flex-col">
                <button
                  ref={btnRoleRef}
                  className="my-3 inline-flex items-center rounded-lg bg-orange-700 px-5  py-2.5 text-center text-sm font-medium text-white hover:bg-orange-800 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                  type="button"
                  onClick={handleToggleRole}
                >
                  {roleOption + " "}
                  <svg
                    className="ms-3 h-2.5 w-2.5"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 10 6"
                  >
                    <path
                      stroke="currentColor"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="m1 1 4 4 4-4"
                    />
                  </svg>
                </button>
                {role && (
                  <div
                    ref={roleRef}
                    className="z-10 w-44 divide-y divide-gray-100 rounded-lg bg-white shadow dark:bg-gray-700"
                  >
                    <ul
                      className="py-2 text-sm text-gray-700 dark:text-gray-200"
                      aria-labelledby="dropdownHoverButton"
                    >
                      <li
                        onClick={() => handleRoleOption("System Administrator")}
                      >
                        <a
                          href="#"
                          className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                        >
                          System administrator
                        </a>
                      </li>
                      <li onClick={() => handleRoleOption("Data analyst")}>
                        <a
                          href="#"
                          className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                        >
                          Data analyst
                        </a>
                      </li>
                      <li onClick={() => handleRoleOption("Data consumer")}>
                        <a
                          href="#"
                          className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                        >
                          Data consumer
                        </a>
                      </li>
                      <li
                        onClick={() =>
                          handleRoleOption("Treatment data capturer")
                        }
                      >
                        <a
                          href="#"
                          className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                        >
                          Treatment data capturer
                        </a>
                      </li>
                      <li
                        onClick={() =>
                          handleRoleOption("General data capturer")
                        }
                      >
                        <a
                          href="#"
                          className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                        >
                          General data capturer
                        </a>
                      </li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex flex-col">
                <button
                  ref={btnStatusRef}
                  className="my-3 inline-flex items-center rounded-lg bg-orange-700 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-800 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                  type="button"
                  onClick={handleToggleStatus}
                >
                  {statusOption + " "}
                  <svg
                    className="ms-3 h-2.5 w-2.5"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 10 6"
                  >
                    <path
                      stroke="currentColor"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="m1 1 4 4 4-4"
                    />
                  </svg>
                </button>
                {status && (
                  <div
                    ref={statusRef}
                    className="z-10 w-44 divide-y divide-gray-100 rounded-lg bg-white shadow dark:bg-gray-700"
                  >
                    <ul
                      className="py-2 text-sm text-gray-700 dark:text-gray-200"
                      aria-labelledby="dropdownHoverButton"
                    >
                      <li onClick={() => handleStatusOption("Active")}>
                        <a
                          href="#"
                          className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                        >
                          Active
                        </a>
                      </li>
                      <li onClick={() => handleStatusOption("Passive")}>
                        <a
                          href="#"
                          className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                        >
                          Passive
                        </a>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
              <input
                className="m-2 rounded-lg border-zinc-800 px-2"
                placeholder="Comments"
              />

              <button className="mt-3 rounded-md bg-orange-500 px-8 py-3 text-lg text-white hover:bg-orange-600">
                Sign up
              </button>
            </div>
          </>
        )}
      </main>
    </>
  );
}

//flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]
//<main className=" flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
//<div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">

/*<button
className="my-3 bg-red-500"
onClick={() => void handleNewUser()}
>
Sign in
</button>*/
