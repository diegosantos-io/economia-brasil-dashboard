
package br.com.economiabr.api.client;

import tools.jackson.databind.JsonNode;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.net.URI;

@Component
public class PibClient {

    private final RestClient restClient;

    public PibClient() {
        this.restClient = RestClient.builder()
                .baseUrl("https://servicodados.ibge.gov.br")
                .build();
    }

    
    public JsonNode buscarPibNominal() {

        String endpoint = "/api/v3/agregados/1846/periodos/-40"
                + "/variaveis/585"
                + "?localidades=N1%5Ball%5D"
                + "&classificacao=11255%5B90707%5D";

        return restClient.get()
                .uri(URI.create(endpoint))
                .retrieve()
                .body(JsonNode.class);
    }


    public JsonNode buscarCrescimentoPib() {

        String endpoint = "/api/v3/agregados/5932/periodos/-40"
                + "/variaveis/6564?localidades=N1%5Ball%5D"
                + "&classificacao=11255%5B90707%5D";

        return restClient.get()
                .uri(URI.create(endpoint))
                .retrieve()
                .body(JsonNode.class);
    }
}
