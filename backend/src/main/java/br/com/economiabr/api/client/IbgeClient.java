
package br.com.economiabr.api.client;

import tools.jackson.databind.JsonNode;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.net.URI;
import java.time.YearMonth;

@Component
public class IbgeClient {

    private final RestClient restClient;

    public IbgeClient() {
        this.restClient = RestClient.builder()
                .baseUrl("https://servicodados.ibge.gov.br")
                .build();
    }

    public JsonNode buscarIpca(int quantidadeMeses) {

        if (quantidadeMeses < 1 || quantidadeMeses > 120) {
            throw new IllegalArgumentException(
                    "O período deve estar entre 1 e 120 meses."
            );
        }

        // Busca meses adicionais para compensar atrasos na divulgação.
        YearMonth fim = YearMonth.now().minusMonths(1);

        YearMonth inicio = fim.minusMonths(quantidadeMeses + 2L);

        String periodoInicial = inicio.toString().replace("-", "");
        String periodoFinal = fim.toString().replace("-", "");

        String endpoint = "/api/v3/agregados/1737/periodos/"
                + periodoInicial + "-" + periodoFinal
                + "/variaveis/63?localidades=N1%5Ball%5D";

        return restClient.get()
                .uri(URI.create(endpoint))
                .retrieve()
                .body(JsonNode.class);
    }
}
