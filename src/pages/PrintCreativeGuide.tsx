import { PrintableCreativeGuide } from "@/components/creative-guide/PrintableCreativeGuide";
import { useNavigate } from "react-router-dom";

const PrintCreativeGuide = () => {
  const navigate = useNavigate();
  
  return <PrintableCreativeGuide onClose={() => navigate('/creative-guide')} />;
};

export default PrintCreativeGuide;
