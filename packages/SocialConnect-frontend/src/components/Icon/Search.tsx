import { useRouter } from "next/router";
import { useState } from "react";

const Search = () => {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const handleSearch = () => {
    router.push(`/search/${search}`);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSearch();
      }}
      className="relative"
    >
      <input
        required
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        type="text"
        placeholder="Search for a friends.."
        className="rounded-3xl border bg-gray-100 border-gray-100 px-5 pr-[44px] py-2 focus:outline-none focus:border-yellow-500"
      />
      <div
        onClick={handleSearch}
        className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-gray-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M21 21l-6-6m-1.414-1.414a7.5 7.5 0 1 1-10.586-10.586 7.5 7.5 0 0 1 10.586 10.586z"
          />
        </svg>
      </div>
    </form>
  );
};

export default Search;
