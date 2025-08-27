import { api } from "../lib/api";
function Dashboard() {


  const handleCopyOrderFromFirestore = () => {
    console.log("Copying order from  Firestore...");
    // ตัวอย่างการเรียก API
    api.post("/orders/CopyOrderFromFirestore", {})
      .then(response => {
        console.log("Order copied successfully:", response.data);
        alert( response.data.message + " Order copied successfully");
      })
      .catch(error => {
        console.error("Error copying order:", error);
      });
  };

  return (<>
    <div>
      <h1>Dashboard</h1>
      <button className="btn btn-primary" onClick={handleCopyOrderFromFirestore}>Click Me</button>
    </div>
  </>);
}
export default Dashboard;