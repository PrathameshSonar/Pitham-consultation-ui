"use client";

import { useState } from "react";
import { requestConsultation } from "@/services/api";

export default function Consultation(){

  const [date,setDate] = useState("");
  const [notes,setNotes] = useState("");

  const bookConsultation = async () => {

    const token = localStorage.getItem("token");

    const res = await requestConsultation({
      date,
      notes
    },token!);

    if(res.payment_url){
      window.location.href = res.payment_url;
    }
  }

  return(

    <div style={{padding:40}}>

      <h2>Consult Guruji</h2>

      <input
        type="date"
        value={date}
        onChange={(e)=>setDate(e.target.value)}
      />

      <br/><br/>

      <textarea
        placeholder="Notes"
        value={notes}
        onChange={(e)=>setNotes(e.target.value)}
      />

      <br/><br/>

      <button onClick={bookConsultation}>
        Pay & Book Consultation
      </button>

    </div>
  )
}