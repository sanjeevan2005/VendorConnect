"""Smoke tests for the VendrSurf backend API."""

import unittest

from tests.conftest import test_client
from vapi import trigger_call


class HealthTests(unittest.TestCase):
    """Health endpoint tests."""

    def test_health_returns_200(self) -> None:
        response = test_client.get("/")
        self.assertEqual(response.status_code, 200)

    def test_health_returns_service_name(self) -> None:
        response = test_client.get("/")
        self.assertEqual(response.json()["service"], "vendrsurf-backend")

    def test_health_returns_ok(self) -> None:
        response = test_client.get("/")
        self.assertTrue(response.json()["ok"])


class ParseRfqTests(unittest.TestCase):
    """RFQ parsing endpoint tests."""

    def test_parse_rfq_requires_anthropic_key(self) -> None:
        response = test_client.post("/parse-rfq", json={"transcript": "Need 500 aluminum brackets."})
        self.assertIn(response.status_code, (500, 502))
        self.assertIn("Anthropic", response.json()["detail"])

    def test_parse_rfq_rejects_empty_transcript(self) -> None:
        response = test_client.post("/parse-rfq", json={"transcript": ""})
        self.assertEqual(response.status_code, 422)  # Pydantic validation


class DiscoverVendorsTests(unittest.TestCase):
    """Vendor discovery endpoint tests."""

    def test_discover_requires_crust_key(self) -> None:
        response = test_client.post(
            "/discover-vendors",
            json={"rfq_id": "rfq-test", "location": "USA", "product_category": "CNC machining"},
        )
        self.assertIn(response.status_code, (500, 502))
        self.assertIn("Crust Data", response.json()["detail"])


class VapiTests(unittest.TestCase):
    """Vapi client tests."""

    def test_rejects_invalid_phone_before_external_call(self) -> None:
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

    def test_rejects_missing_variables(self) -> None:
        with self.assertRaisesRegex(ValueError, "Missing required variables"):
            trigger_call(
                assistant_id="assistant",
                vendor_phone="+14155551234",
                variables={"buyer_company": "Buyer"},
            )


class UtilsTests(unittest.TestCase):
    """Utility function tests."""

    def test_coerce_int_valid(self) -> None:
        from app.utils.coerce import coerce_int
        self.assertEqual(coerce_int("42"), 42)
        self.assertEqual(coerce_int(42), 42)

    def test_coerce_int_none(self) -> None:
        from app.utils.coerce import coerce_int
        self.assertIsNone(coerce_int(None))
        self.assertIsNone(coerce_int(""))
        self.assertIsNone(coerce_int("abc"))

    def test_coerce_enum_valid(self) -> None:
        from app.utils.coerce import coerce_enum
        self.assertEqual(coerce_enum("KG", {"kg", "tons"}), "kg")

    def test_coerce_enum_invalid(self) -> None:
        from app.utils.coerce import coerce_enum
        self.assertIsNone(coerce_enum("invalid", {"kg", "tons"}))

    def test_normalize_phone_valid(self) -> None:
        from app.utils.phone import normalize_phone
        self.assertEqual(normalize_phone("+14155551234"), "+14155551234")

    def test_normalize_phone_invalid(self) -> None:
        from app.utils.phone import normalize_phone
        self.assertIsNone(normalize_phone("555-0100"))
        self.assertIsNone(normalize_phone(None))

    def test_quantity_phrase(self) -> None:
        from app.utils.spoken_form import quantity_phrase
        self.assertEqual(quantity_phrase(500, "units"), "500 units")
        self.assertEqual(quantity_phrase(None, None), "an unspecified quantity")
        self.assertEqual(quantity_phrase(5, "kg"), "five kg")

    def test_email_to_spoken(self) -> None:
        from app.utils.spoken_form import email_to_spoken
        self.assertEqual(email_to_spoken("team@vendrsurf.com"), "team at vendrsurf dot com")


if __name__ == "__main__":
    unittest.main()
