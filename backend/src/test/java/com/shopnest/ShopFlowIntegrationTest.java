package com.shopnest;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Runs against the in-memory H2 database with the demo catalogue seeded. */
@SpringBootTest
@AutoConfigureMockMvc
class ShopFlowIntegrationTest {

    @Autowired
    MockMvc mvc;

    @Autowired
    ObjectMapper json;

    private static final Map<String, Object> ADDRESS = Map.of(
            "recipientName", "Test Buyer", "phone", "9876543210", "line1", "12 MG Road",
            "city", "Bengaluru", "state", "Karnataka", "postalCode", "560001", "country", "India");

    @Test
    void catalogueIsPublic() throws Exception {
        mvc.perform(get("/api/products").param("size", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(5))
                .andExpect(jsonPath("$.totalElements").isNumber());
        mvc.perform(get("/api/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(6));
    }

    @Test
    void protectedEndpointsRequireTheRightRole() throws Exception {
        mvc.perform(get("/api/cart")).andExpect(status().isUnauthorized());

        String customer = registerAndGetToken();
        mvc.perform(auth(get("/api/admin/dashboard"), customer)).andExpect(status().isForbidden());
        mvc.perform(auth(post("/api/categories"), customer)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Hacked\"}"))
                .andExpect(status().isForbidden());

        String admin = login("admin@shopnest.dev", "Admin@123");
        mvc.perform(auth(get("/api/admin/dashboard"), admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.activeProducts").isNumber());
    }

    @Test
    void customerCanBuyAndAdminCanShip() throws Exception {
        String token = registerAndGetToken();
        JsonNode product = firstInStockProduct();
        long productId = product.get("id").asLong();
        int stockBefore = product.get("stock").asInt();

        mvc.perform(auth(post("/api/cart/items"), token).contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("productId", productId, "quantity", 2))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.itemCount").value(2));

        var checkout = Map.of("shippingAddress", ADDRESS, "paymentMethod", "CARD",
                "card", Map.of("number", "4242 4242 4242 4242", "expiry", "12/40", "cvv", "123"));
        String orderJson = mvc.perform(auth(post("/api/orders"), token).contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(checkout)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("CONFIRMED"))
                .andExpect(jsonPath("$.paymentReference").value("CARD-4242"))
                .andExpect(jsonPath("$.items[0].quantity").value(2))
                .andReturn().getResponse().getContentAsString();
        long orderId = json.readTree(orderJson).get("id").asLong();

        mvc.perform(auth(get("/api/cart"), token))
                .andExpect(jsonPath("$.itemCount").value(0));
        mvc.perform(get("/api/products/" + productId))
                .andExpect(jsonPath("$.stock").value(stockBefore - 2));

        String admin = login("admin@shopnest.dev", "Admin@123");
        mvc.perform(auth(patch("/api/admin/orders/" + orderId + "/status"), admin)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"SHIPPED\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SHIPPED"));
        // A shipped order can no longer be cancelled by the customer.
        mvc.perform(auth(post("/api/orders/" + orderId + "/cancel"), token))
                .andExpect(status().isConflict());

        // Having bought it, the review is marked as a verified purchase.
        mvc.perform(auth(post("/api/products/" + productId + "/reviews"), token)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"rating\":5,\"comment\":\"Great\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.verifiedPurchase").value(true));
    }

    @Test
    void declinedCardKeepsTheCartAndStock() throws Exception {
        String token = registerAndGetToken();
        JsonNode product = firstInStockProduct();
        long productId = product.get("id").asLong();

        mvc.perform(auth(post("/api/cart/items"), token).contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("productId", productId, "quantity", 1))))
                .andExpect(status().isOk());

        var checkout = Map.of("shippingAddress", ADDRESS, "paymentMethod", "CARD",
                "card", Map.of("number", "4000 0000 0000 0002", "expiry", "12/40", "cvv", "123"));
        mvc.perform(auth(post("/api/orders"), token).contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(checkout)))
                .andExpect(status().isPaymentRequired());

        mvc.perform(auth(get("/api/cart"), token)).andExpect(jsonPath("$.itemCount").value(1));
        mvc.perform(get("/api/products/" + productId))
                .andExpect(jsonPath("$.stock").value(product.get("stock").asInt()));
    }

    @Test
    void validationErrorsNameTheField() throws Exception {
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\":\"A\",\"email\":\"not-an-email\",\"password\":\"short\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.email").exists())
                .andExpect(jsonPath("$.fieldErrors.password").exists());
    }

    private JsonNode firstInStockProduct() throws Exception {
        String body = mvc.perform(get("/api/products").param("inStock", "true").param("sort", "price_asc"))
                .andReturn().getResponse().getContentAsString();
        JsonNode content = json.readTree(body).get("content");
        for (JsonNode p : content) {
            if (p.get("stock").asInt() >= 10) {
                return p;
            }
        }
        throw new AssertionError("No product with enough stock in seed data");
    }

    private String registerAndGetToken() throws Exception {
        String email = "buyer-" + UUID.randomUUID() + "@test.dev";
        String body = mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "fullName", "Test Buyer", "email", email, "password", "Password@1"))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        String token = json.readTree(body).get("token").asText();
        assertThat(token).isNotBlank();
        return token;
    }

    private String login(String email, String password) throws Exception {
        String body = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("email", email, "password", password))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return json.readTree(body).get("token").asText();
    }

    private static MockHttpServletRequestBuilder auth(MockHttpServletRequestBuilder req, String token) {
        return req.header("Authorization", "Bearer " + token);
    }
}
