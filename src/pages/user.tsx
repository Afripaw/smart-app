import { type NextPage } from "next";
import Head from "next/head";
import { SetStateAction, useEffect, useRef, useState } from "react";
import { api } from "~/utils/api";
import { useRouter } from "next/router";
import Navbar from "../components/navbar";
import { Trash } from "phosphor-react";

const User: NextPage = () => {
  const router = useRouter();
  const newUser = api.user.create.useMutation();
  const updateUser = api.user.update.useMutation();
  //const [user, setUser] = useState<{ id: string } | null>(null);
  const [isUpdate, setIsUpdate] = useState(false);
  const [isCreate, setIsCreate] = useState(false);
  //Update the table when user is deleted
  const [isDeleted, setIsDeleted] = useState(false);
  // const userTable = api.user.getAllUsers.useQuery();

  //-------------------------------SEARCH BAR------------------------------------
  //Query the users table
  const [query, setQuery] = useState("");

  //-------------------------------TABLE-----------------------------------------
  const data = api.user.searchUsers.useQuery({ searchQuery: query });
  //delete specific row
  const deleteRow = api.user.deleteUser.useMutation();
  const handleDeleteRow = async (id: string) => {
    await deleteRow.mutateAsync({ userID: id });
    isDeleted ? setIsDeleted(false) : setIsDeleted(true);
  };
  //autoload the table
  useEffect(() => {
    void data.refetch();
  }, [isUpdate, isDeleted]);

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

  const handleCreateNewUser = async () => {
    isCreate ? setIsCreate(false) : setIsCreate(true);
    isUpdate ? setIsUpdate(false) : setIsUpdate(false);
  };

  const handleUpdateUser = async () => {
    isUpdate ? setIsUpdate(false) : setIsUpdate(true);
    isCreate ? setIsCreate(false) : setIsCreate(false);
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
    //After the newUser has been created make sure to set the fields back to empty
    setFirstName("");
    setEmail("");
    setSurname("");
    setPassword("");
    setConfirmPassword("");
    setMobile("");
    setGreaterAreaOption("Greater Area");
    setAddressStreet("");
    setAddressStreetCode("");
    setAddressStreetNumber("");
    setAddressSuburb("");
    setAddressPostalCode("");
    setPreferredCommunicationOption("Preferred Communication");
    setRoleOption("Role");
    setStatusOption("Status");
    setComments("");
  };

  //On change of search bar, query the users table
  /* useEffect(() => {
        const userTableSearch = api.user.searchUsers.useQuery({ searchQuery: query });
    },[query]);*/

  return (
    <>
      <Head>
        <title>User Profiles</title>
      </Head>
      <main className="flex flex-col">
        <Navbar />
        <div className="flex grow flex-col justify-center">
          <div className="mx-96 flex justify-between">
            <button
              className="rounded-lg bg-orange-600 p-3 hover:bg-orange-700"
              onClick={handleCreateNewUser}
            >
              Create new User
            </button>
            <button
              className="rounded-lg bg-orange-600 p-3 hover:bg-orange-700"
              onClick={handleUpdateUser}
            >
              Update User
            </button>
          </div>
        </div>
        {isUpdate && !isCreate && (
          <>
            <div className="mb-2 mt-3 flex flex-col items-center">
              <input
                className="m-2 w-1/3 rounded-lg border-2 border-zinc-800 px-2"
                placeholder="Search..."
                onChange={(e) => setQuery(e.target.value)}
              />
              {/*Make a table with all the users and then when you click on the user it will populate the fields*/}
              {/*<button
                    className="rounded-lg bg-orange-600 p-3 hover:bg-orange-700"
                    onClick={handleUpdateUser}
                    >
                    Search
                    </button>*/}
              <article className="horisonal-scroll flex max-h-[80rem] w-full items-center justify-center overflow-auto rounded-md shadow-inner">
                <table className="table-auto">
                  <thead>
                    <tr>
                      <th className="px-4 py-2">First Name</th>
                      <th className="px-4 py-2">Surname</th>
                      <th className="px-4 py-2">Email</th>
                      <th className="px-4 py-2">Mobile</th>
                      <th className="px-4 py-2">Greater Area</th>
                      <th className="px-4 py-2">Street</th>
                      <th className="px-4 py-2">Street Code</th>
                      <th className="px-4 py-2">Street Number</th>
                      <th className="px-4 py-2">Suburb</th>
                      <th className="px-4 py-2">Postal Code</th>
                      <th className="px-4 py-2">Preferred Communication</th>
                      <th className="px-4 py-2">Role</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2">Comments</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.data?.map((user) => {
                      return (
                        <tr className="items-center">
                          <td className="border px-4 py-2">{user.name}</td>
                          <td className="border px-4 py-2">{user.surname}</td>
                          <td className="border px-4 py-2">{user.email}</td>
                          <td className="border px-4 py-2">{user.mobile}</td>
                          <td className="border px-4 py-2">
                            {user.addressGreaterArea}
                          </td>
                          <td className="border px-4 py-2">
                            {user.addressStreet}
                          </td>
                          <td className="border px-4 py-2">
                            {user.addressStreetCode}
                          </td>
                          <td className="border px-4 py-2">
                            {user.addressStreetNumber}
                          </td>
                          <td className="border px-4 py-2">
                            {user.addressSuburb}
                          </td>
                          <td className="border px-4 py-2">
                            {user.addressPostalCode}
                          </td>
                          <td className="border px-4 py-2">
                            {user.preferredCommunication}
                          </td>
                          <td className="border px-4 py-2">{user.role}</td>
                          <td className="border px-4 py-2">{user.status}</td>
                          <td className="border px-4 py-2">{user.comments}</td>
                          <Trash
                            size={24}
                            className="mx-2 my-3"
                            onClick={() => handleDeleteRow(user.id)}
                          />
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </article>
            </div>
          </>
        )}
        {!isUpdate && isCreate && (
          <>
            <div className="mb-2 flex flex-col">
              <div className="flex justify-center">
                <div className="mb-2 mt-3 flex grow flex-col items-center rounded-lg bg-slate-200 px-5 py-3">
                  <div className="mb-3 mt-3 text-2xl">Create New User</div>
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
              <input
                className="m-2 rounded-lg border-zinc-800 px-2"
                placeholder="Comments"
                onChange={(e) => setComments(e.target.value)}
              />

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
                className="my-4 rounded-md bg-orange-500 px-8 py-3 text-lg text-white hover:bg-orange-600"
                onClick={() => void handleNewUser()}
              >
                Create
              </button>
            </div>
          </>
        )}
      </main>
    </>
  );
};

export default User;
