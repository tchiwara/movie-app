import Search from "./components/Search.jsx";
import {useState} from "react";

const App = () => {

    const [searchTerm, setSearchTerm] = useState('');

    return (
       <main>
           <div className="pattern" />

           <div className="wrapper">
               <header>
                   <img src="./hero.png" alt="Hero Baner" />
                   <h1>Find <span className="text-gradient">Movies</span>You'll Enjoy Without The Hassle</h1>
               </header>

               <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
               <h1>{searchTerm}</h1>
           </div>


       </main>
    );
};

export default App;