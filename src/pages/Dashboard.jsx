import { api } from "../lib/api";
function Dashboard() {


  const handleCopyOrderFromFirestore = () => {
    console.log("Copying order from Firestore...");
    // ตั้งค่า timeout เป็น 30 นาที (1800000 ms)
    api.post("/orders/CopyOrderFromFirestore", {}, { timeout: 1800000 })
      .then(response => {
      console.log("Order copied successfully:", response.data);
      alert(response.data.message + " Order copied successfully");
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