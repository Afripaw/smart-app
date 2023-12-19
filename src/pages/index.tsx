import { signIn, signOut, useSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";

import { api } from "~/utils/api";
import { useRouter } from "next/router";
import { SetStateAction, useState, useEffect, useRef, use } from "react";
import { authOptions } from "~/server/auth";
import { set } from "zod";
//import { sign } from "crypto";

export default function Home() {
  //const hello = api.post.hello.useQuery({ text: "from tRPC" });

  const { data: session } = useSession();
  const newUser = api.user.create.useMutation();
  const deleteAll = api.user.deleteAll.useMutation();
  const newPet = api.pet.create.useMutation();
  const [signUp, setSignUp] = useState(false);
  const [signIn_, setSignIn_] = useState(false);
  //For moving between different pages
  const router = useRouter();

  //---------------------------------EDIT BOXES----------------------------------
  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [addressStreet, setAddressStreet] = useState("");
  const [addressStreetCode, setAddressStreetCode] = useState("");
  const [addressStreetNumber, setAddressStreetNumber] = useState("");
  const [addressSuburb, setAddressSuburb] = useState("");
  const [addressPostalCode, setAddressPostalCode] = useState("");
  const [comments, setComments] = useState("");

  //passwords
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

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

  //--------------------------------LOGIN BUTTONS--------------------------------
  //handle sign up
  const handleSignUp = async () => {
    signUp ? setSignUp(false) : setSignUp(true);
  };

  //handle sign in
  const handleSignIn = async () => {
    signIn_ ? setSignIn_(false) : setSignIn_(true);
  };

  //delete all records button
  const deleteAllRecords = async () => {
    await deleteAll.mutateAsync();
  };

  const handleWelcomePage = async () => {
    setSignIn_(false);
    setSignUp(false);
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await signIn();
      if (result) {
        console.log("Sign-in successful");
        void router.push("/dashboard");
      } else {
        console.log("Sign-in failed");
      }
    } catch (error) {
      console.log("Error during sign-in:", error);
    }
  };

  const handleNewUser = async () => {
    if (password != confirmPassword) {
      console.log("Passwords do not match");
      return;
    }
    if (greaterAreaOption === "Greater Area") {
      setGreaterAreaOption(" ");
    }
    if (preferredOption === "Preferred Communication") {
      setPreferredCommunicationOption(" ");
    }
    if (roleOption === "Role") {
      setRoleOption(" ");
    }
    if (statusOption === "Status") {
      setStatusOption(" ");
    }
    //void signIn();
    await newUser.mutateAsync({
      firstName: firstName,
      email: email,
      surname: surname,
      password: password,
      mobile: mobile,
      addressGreaterArea: greaterAreaOption,
      addressStreet: addressStreet,
      addressStreetCode: addressStreetCode,
      addressStreetNumber: addressStreetNumber,
      addressSuburb: addressSuburb,
      addressPostalCode: addressPostalCode,
      preferredCommunication: preferredOption,
      role: roleOption,
      status: statusOption,
      comments: comments,
    });
    //if succesful go to dashboard
    //else display error message
    if (newUser) {
      void router.push("/dashboard");
    } else {
      console.log("error");
    }
  };

  const handleUser = async () => {
    //void signIn();
    const result = await signIn("credentials", {
      email: email,
      password: password,
      redirect: false,
    });
    console.log(result);
    if (result) {
      console.log("Sign-in successful");
      void router.push("/dashboard");
    } else {
      console.log("Sign-in failed");
    }
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
        {!signIn_ && !signUp && (
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
        {signIn_ && !signUp && (
          <>
            <div className="mb-2 flex flex-col bg-slate-300">
              <div className="flex grow justify-between bg-white">
                <button
                  className="m-3 rounded-lg bg-orange-500 p-2"
                  onClick={handleWelcomePage}
                >
                  Back to Welcome Page
                </button>
                <button
                  className="mb-3 ml-3 mr-3 mt-3 rounded-lg bg-orange-400 p-2"
                  onClick={handleGoogleSignIn}
                >
                  Sign In with Google
                </button>
                {/*<button
                  className="m-3 rounded-lg bg-slate-400 p-2"
                  onClick={deleteAllRecords}
                >
                  Delete all user records
        </button>*/}
              </div>
              <div className="flex justify-center">
                <div className="mb-2 flex flex-col items-center rounded-lg bg-slate-300 px-5 py-3">
                  <div className="mb-3 text-4xl">Sign In</div>
                  <div className="text-lg">Enter Credentials</div>
                </div>
              </div>
            </div>
            <div className="flex grow flex-col items-center">
              <input
                className="m-2 rounded-lg border-zinc-800 px-2"
                placeholder="Email"
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                className="m-2 rounded-lg border-zinc-800 px-2"
                placeholder="Password"
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                className="mt-4 rounded-md bg-orange-500 px-8 py-3 text-lg text-white hover:bg-orange-600"
                onClick={() => void handleUser()}
              >
                Sign in
              </button>
            </div>
          </>
        )}
        {!signIn_ && signUp && (
          <>
            <div className="mb-2 flex flex-col bg-slate-300">
              <div className="flex grow justify-between bg-white">
                <button
                  className="m-3 rounded-lg bg-orange-500 p-2"
                  onClick={handleWelcomePage}
                >
                  Back to Welcome Page
                </button>
                <button
                  className="m-3 rounded-lg bg-orange-500 p-2"
                  onClick={handleGoogleSignIn}
                >
                  Sign Up with Google
                </button>
                {/*<button
                  className="m-3 rounded-lg bg-slate-400 p-2"
                  onClick={deleteAllRecords}
                >
                  Delete all user records
        </button>*/}
              </div>
              <div className="flex justify-center">
                <div className="mb-2 flex grow flex-col items-center rounded-lg bg-slate-300 px-5 py-3">
                  <div className="mb-3 mt-3 text-4xl">Create Account</div>
                  <div className="text-lg">Enter the following fields</div>
                </div>
              </div>
            </div>
            <div className="flex grow flex-col items-center">
              <input
                className="m-2 rounded-lg border-zinc-800 px-2 "
                placeholder="First Name"
                onChange={(e) => setFirstName(e.target.value)}
              />
              <input
                className="m-2 rounded-lg border-zinc-800 px-2"
                placeholder="Surname"
                onChange={(e) => setSurname(e.target.value)}
              />
              <input
                className="m-2 rounded-lg border-zinc-800 px-2"
                placeholder="Email"
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                className="m-2 rounded-lg border-zinc-800 px-2"
                placeholder="Mobile"
                onChange={(e) => setMobile(e.target.value)}
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
                onChange={(e) => setAddressStreet(e.target.value)}
              />
              <input
                className="m-2 rounded-lg border-zinc-800 px-2 "
                placeholder="Address Street Code"
                onChange={(e) => setAddressStreetCode(e.target.value)}
              />
              <input
                className="m-2 rounded-lg border-zinc-800 px-2"
                placeholder="Address Street Number"
                onChange={(e) => setAddressStreetNumber(e.target.value)}
              />
              <input
                className="m-2 rounded-lg border-zinc-800 px-2"
                placeholder="Address Suburb"
                onChange={(e) => setAddressSuburb(e.target.value)}
              />
              <input
                className="m-2 rounded-lg border-zinc-800 px-2"
                placeholder="Address Postal Code"
                onChange={(e) => setAddressPostalCode(e.target.value)}
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

              {/*<div className="flex flex-col">
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
                onChange={(e) => setComments(e.target.value)}
              />*/}

              <input
                className="m-2 rounded-lg border-zinc-800 px-2"
                placeholder="Password"
                onChange={(e) => setPassword(e.target.value)}
              />
              <input
                className="m-2 rounded-lg border-zinc-800 px-2"
                placeholder="Confirm Password"
                onChange={(e) => setConfirmPassword(e.target.value)}
              />

              <button
                className="mt-4 rounded-md bg-orange-500 px-8 py-3 text-lg text-white hover:bg-orange-600"
                onClick={() => void handleNewUser()}
              >
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
