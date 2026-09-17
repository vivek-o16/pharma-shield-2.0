
(function(){
  "use strict";
  const form=document.getElementById("feedback-form");
  if(!form) return;
  const status=document.getElementById("feedback-status");
  form.addEventListener("submit",function(e){
    e.preventDefault();
    const data={
      name:document.getElementById("fb-name").value.trim(),
      email:document.getElementById("fb-email").value.trim(),
      message:document.getElementById("fb-message").value.trim(),
      submittedAt:new Date().toISOString()
    };
    if(!data.message){status.textContent="Please enter your feedback.";return;}
    try{
      const old=JSON.parse(localStorage.getItem("pharmaShieldFeedback")||"[]");
      old.push(data);
      localStorage.setItem("pharmaShieldFeedback",JSON.stringify(old.slice(-20)));
      status.textContent="Feedback captured successfully on this device. Thank you!";
      form.reset();
    }catch(err){
      status.textContent="Feedback could not be saved in this browser. Please try again.";
    }
  });
})();
