import unittest

from fastapi.testclient import TestClient

from main import app
from vapi import trigger_call


class ApiSmokeTests(unittest.TestCase):
    def setUp(self) -> None:
        self.client = TestClient(app)

    def test_health(self) -> None:
        response = self.client.get("/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["service"], "vendrsurf-backend")

    def test_parse_rfq_requires_anthropic_key(self) -> None:
        response = self.client.post("/parse-rfq", json={"transcript": "Need 500 aluminum brackets."})

        self.assertEqual(response.status_code, 500)
        self.assertIn("ANTHROPIC_API_KEY", response.json()["detail"])

    def test_discover_requires_crust_key(self) -> None:
        response = self.client.post(
            "/discover-vendors",
            json={"rfq_id": "rfq-test", "location": "USA", "product_category": "CNC machining"},
        )

        self.assertEqual(response.status_code, 500)
        self.assertIn("CRUST_DATA_API_KEY", response.json()["detail"])

    def test_vapi_rejects_invalid_phone_before_external_call(self) -> None:
        with self.assertRaisesRegex(ValueError, "E.164"):
            trigger_call(
                assistant_id="assistant",
                vendor_phone="555-0100",
                variables={
                    "buyer_company": "Buyer",
                    "buyer_one_liner": "Buyer sources parts.",
                    "vendor_company": "Vendor",
                    "contact_first_name": "Alex",
                    "rfq_one_liner": "custom part",
                    "preferred_process": "CNC",
                    "preferred_material": "aluminum",
                    "target_quantity_phrase": "five units",
                    "eau_phrase": "a one-time order",
                    "key_constraint": "standard terms",
                    "required_certifications": "none",
                    "email_followup_contact": "team at example dot com",
                },
            )


if __name__ == "__main__":
    unittest.main()
